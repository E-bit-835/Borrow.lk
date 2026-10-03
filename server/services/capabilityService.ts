import { query } from '../config/db';
import { config } from '../config/env';
import { formatUser } from '../utils/formatUser';
import { notify } from '../utils/notify';
import {
  capabilitiesOf,
  hostStatusOf,
  providerStatusOf,
  type Capability,
  type PartnerCapability,
  type PartnerStatus,
} from '../utils/capabilities';

function httpError(message: string, code: string, status: number) {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

const COLUMNS: Record<PartnerCapability, { status: string; profile: string; label: string }> = {
  HOST: { status: 'host_status', profile: 'host_profile', label: 'host' },
  PROVIDER: { status: 'provider_status', profile: 'provider_profile', label: 'service provider' },
};

export interface PartnerApplication {
  phone?: string;
  district?: string;
  city?: string;
  businessName?: string;
  /** Free-form answers from the onboarding form (categories, description, experience, NIC...) */
  details: Record<string, any>;
}

export class CapabilityService {
  /** Always read from the database: capabilities change after the JWT was issued. */
  static async getCapabilities(userId: string): Promise<{ role: string; capabilities: Capability[] }> {
    const res = await query(`SELECT role, host_status, provider_status, is_suspended FROM users WHERE id = $1`, [userId]);
    if (res.rows.length === 0) {
      throw httpError('User not found.', 'USER_NOT_FOUND', 404);
    }
    if (res.rows[0].is_suspended) {
      throw httpError('This account has been suspended.', 'ACCOUNT_SUSPENDED', 403);
    }
    return { role: res.rows[0].role, capabilities: capabilitiesOf(res.rows[0]) };
  }

  /** Throws 403 unless the user is an admin or holds one of the approved capabilities. */
  static async assertCapability(userId: string, ...anyOf: PartnerCapability[]) {
    const { role, capabilities } = await this.getCapabilities(userId);
    if (role === 'admin' || anyOf.some((cap) => capabilities.includes(cap))) return;

    const needed = anyOf.map((cap) => COLUMNS[cap].label).join(' or ');
    throw httpError(`An approved ${needed} account is required for this action.`, 'CAPABILITY_REQUIRED', 403);
  }

  /** "Become a Host" / "Become a Provider": adds the capability to the existing account. */
  static async apply(userId: string, capability: PartnerCapability, application: PartnerApplication) {
    const res = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const row = res.rows[0];
    if (!row) throw httpError('User not found.', 'USER_NOT_FOUND', 404);
    if (row.role === 'admin') {
      throw httpError('Administrator accounts cannot become hosts or providers.', 'FORBIDDEN', 403);
    }

    const current = capability === 'HOST' ? hostStatusOf(row) : providerStatusOf(row);
    if (current === 'approved') {
      throw httpError(`You are already an approved ${COLUMNS[capability].label}.`, 'ALREADY_APPROVED', 400);
    }
    if (current === 'pending') {
      throw httpError('Your application is already under review.', 'APPLICATION_PENDING', 400);
    }

    const nextStatus: PartnerStatus = config.requirePartnerApproval ? 'pending' : 'approved';
    const col = COLUMNS[capability];
    const profile = { ...application.details, submittedAt: new Date().toISOString() };

    const updated = await query(
      `UPDATE users
          SET ${col.status} = $1,
              ${col.profile} = $2,
              phone = COALESCE($3, phone),
              district = COALESCE($4, district),
              city = COALESCE($5, city),
              business_name = COALESCE($6, business_name),
              updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
      [
        nextStatus,
        JSON.stringify(profile),
        application.phone || null,
        application.district || null,
        application.city || null,
        application.businessName || null,
        userId,
      ]
    );

    return formatUser(updated.rows[0]);
  }

  /** Admin: host / provider applications, newest first. */
  static async listApplications(status: PartnerStatus = 'pending') {
    const res = await query(
      `SELECT * FROM users
        WHERE host_status = $1 OR provider_status = $1
        ORDER BY updated_at DESC
        LIMIT 200`,
      [status]
    );

    return res.rows.flatMap((row) => {
      const user = formatUser(row);
      const items = [];
      if (row.host_status === status) {
        items.push({ user, capability: 'HOST' as const, status, application: row.host_profile || {} });
      }
      if (row.provider_status === status) {
        items.push({ user, capability: 'PROVIDER' as const, status, application: row.provider_profile || {} });
      }
      return items;
    });
  }

  /** Admin: approve, reject or revoke a capability. */
  static async setStatus(userId: string, capability: PartnerCapability, status: PartnerStatus) {
    const col = COLUMNS[capability];
    const res = await query(
      `UPDATE users SET ${col.status} = $1, updated_at = NOW() WHERE id = $2 AND role <> 'admin' RETURNING *`,
      [status, userId]
    );
    if (res.rows.length === 0) {
      throw httpError('User not found.', 'USER_NOT_FOUND', 404);
    }
    if (status === 'approved' || status === 'rejected') {
      const approved = status === 'approved';
      await notify(
        userId,
        'system',
        `${col.label === 'host' ? 'Host' : 'Provider'} application ${approved ? 'approved' : 'not approved'}`,
        approved ? `You can now publish ${capability === 'HOST' ? 'rental' : 'service'} listings.` : 'You can update your details and apply again.',
        approved ? '/provider/dashboard' : capability === 'HOST' ? '/become-host' : '/become-provider'
      );
    }
    return formatUser(res.rows[0]);
  }
}
