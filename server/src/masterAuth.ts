/**
 * Master Governance Authorization Policy
 * --------------------------------------
 * Least-privilege guard: impersonation/demo sessions carry originalRole === 'master'
 * and may call /stop-impersonation (or /demo-login), while full master routes
 * require live role === 'master'.
 */

export function isMasterAuthorized(
  authUser: { role?: string; originalRole?: string } | undefined | null,
  requestPath: string,
): boolean {
  if (!authUser) return false;
  if (authUser.role === 'master') return true;
  const cleanPath = requestPath.replace(/\/+$/, '') || '/';
  if (
    authUser.originalRole === 'master' &&
    (cleanPath === '/stop-impersonation' || cleanPath === '/demo-login')
  ) {
    return true;
  }
  return false;
}
