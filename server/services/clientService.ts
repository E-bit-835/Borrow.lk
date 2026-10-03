import { query } from '../config/db';

export interface CreateClientDTO {
  userId?: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  district: string;
  city: string;
  address?: string;
  avatar?: string;
  nicNumber?: string;
  clientType?: 'individual' | 'corporate' | 'agency';
  notes?: string;
}

/** The authenticated user making the request. Non-admins only reach clients they created. */
export interface ClientViewer {
  id: string;
  role: 'customer' | 'provider' | 'admin';
}

function clientNotFound() {
  const error: any = new Error('Client not found.');
  error.code = 'CLIENT_NOT_FOUND';
  error.status = 404;
  return error;
}

export class ClientService {
  static async getAll(
    filters: { search?: string; status?: string; district?: string },
    viewer: ClientViewer
  ) {
    let sql = `SELECT * FROM clients WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (viewer.role !== 'admin') {
      sql += ` AND user_id = $${idx}`;
      params.push(viewer.id);
      idx++;
    }

    if (filters.status) {
      sql += ` AND status = $${idx}`;
      params.push(filters.status);
      idx++;
    }

    if (filters.district) {
      sql += ` AND district ILIKE $${idx}`;
      params.push(`%${filters.district}%`);
      idx++;
    }

    if (filters.search) {
      sql += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx} OR company ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY created_at DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  static async getById(id: string, viewer: ClientViewer) {
    const res = await query(`SELECT * FROM clients WHERE id = $1`, [id]);
    const client = res.rows[0];
    // Same response for a missing client and one owned by someone else, so IDs cannot be probed
    if (!client || (viewer.role !== 'admin' && client.user_id !== viewer.id)) {
      throw clientNotFound();
    }
    return client;
  }

  static async create(data: CreateClientDTO) {
    const res = await query(
      `INSERT INTO clients (user_id, name, email, phone, company, district, city, address, avatar, nic_number, client_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.userId || null,
        data.name.trim(),
        data.email?.trim() || null,
        data.phone.trim(),
        data.company?.trim() || null,
        data.district.trim(),
        data.city.trim(),
        data.address?.trim() || null,
        data.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80`,
        data.nicNumber?.trim() || null,
        data.clientType || 'individual',
        data.notes || null,
      ]
    );

    return res.rows[0];
  }

  static async update(id: string, updates: Partial<CreateClientDTO> & { status?: string }, viewer: ClientViewer) {
    // Throws 404 unless the viewer may access this client
    await this.getById(id, viewer);

    const allowed = ['name', 'email', 'phone', 'company', 'district', 'city', 'address', 'avatar', 'nic_number', 'client_type', 'status', 'notes'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      nicNumber: 'nic_number',
      clientType: 'client_type',
    };

    for (const [key, val] of Object.entries(updates)) {
      const col = mapping[key] || key;
      if (allowed.includes(col) && val !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return this.getById(id, viewer);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE clients SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (res.rows.length === 0) {
      throw clientNotFound();
    }

    return res.rows[0];
  }

  static async delete(id: string, viewer: ClientViewer) {
    // Throws 404 unless the viewer may access this client
    await this.getById(id, viewer);

    const res = await query(`DELETE FROM clients WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      throw clientNotFound();
    }
    return { id, deleted: true };
  }
}
