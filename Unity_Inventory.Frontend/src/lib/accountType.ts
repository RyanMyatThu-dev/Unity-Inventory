/**
 * Global account type from API (Tbl_Users.AccountType), distinct from per-business role.
 * Empty / missing is treated as Owner for backward compatibility.
 */
export function normalizeAccountType(value: unknown): string {
  if (value == null) return 'Owner';
  const s = String(value).trim();
  return s === '' ? 'Owner' : s;
}

/** Only Owner-type accounts may create new businesses in the UI (and API). */
export function canProvisionNewBusiness(accountType?: string | null): boolean {
  return normalizeAccountType(accountType).toLowerCase() === 'owner';
}
