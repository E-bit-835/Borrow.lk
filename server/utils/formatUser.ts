import { capabilitiesOf, hostStatusOf, providerStatusOf } from './capabilities';

/** Map a Neon/pg user row (snake_case) to the camelCase shape the frontend expects. */
export function formatUser(row: Record<string, any>) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name ?? row.firstName ?? '',
    lastName: row.last_name ?? row.lastName ?? '',
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    suspended: Boolean(row.is_suspended),
    capabilities: capabilitiesOf(row),
    hostStatus: hostStatusOf(row),
    providerStatus: providerStatusOf(row),
    district: row.district ?? undefined,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    businessName: row.business_name ?? row.businessName ?? undefined,
    avatar: row.avatar ?? undefined,
    dob: row.dob ?? undefined,
    verificationStatus: row.verification_status ?? row.verificationStatus ?? 'unverified',
    emailVerified: Boolean(row.email_verified ?? row.emailVerified),
    phoneVerified: Boolean(row.phone_verified ?? row.phoneVerified),
    nicVerified: Boolean(row.nic_verified ?? row.nicVerified),
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewsCount: row.reviews_count ?? row.reviewsCount ?? undefined,
    rentalsCount: row.rentals_count ?? row.rentalsCount ?? undefined,
    memberSince: row.member_since ?? row.memberSince ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}
