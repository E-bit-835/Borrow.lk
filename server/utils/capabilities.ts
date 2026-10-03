/**
 * One account, many capabilities.
 * Every user is a RENTER. HOST (rental listings) and PROVIDER (service listings)
 * are added to the same account once the matching application is approved.
 */
export type Capability = 'RENTER' | 'HOST' | 'PROVIDER';
export type PartnerCapability = 'HOST' | 'PROVIDER';
export type PartnerStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const PARTNER_STATUSES: PartnerStatus[] = ['none', 'pending', 'approved', 'rejected'];

export function hostStatusOf(row: Record<string, any>): PartnerStatus {
  const status = row.host_status as PartnerStatus | undefined;
  if (status && status !== 'none') return status;
  // Accounts created before capabilities existed used role = 'provider' for anyone who could list
  return row.role === 'provider' ? 'approved' : 'none';
}

export function providerStatusOf(row: Record<string, any>): PartnerStatus {
  return (row.provider_status as PartnerStatus | undefined) || 'none';
}

export function capabilitiesOf(row: Record<string, any>): Capability[] {
  const capabilities: Capability[] = ['RENTER'];
  if (hostStatusOf(row) === 'approved') capabilities.push('HOST');
  if (providerStatusOf(row) === 'approved') capabilities.push('PROVIDER');
  return capabilities;
}
