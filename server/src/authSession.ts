/**
 * Authentication session cookie policy.
 *
 * Persistent signed JWT stored in an httpOnly cookie and revoked via
 * User.pwdEpoch on explicit logout or password rotation.
 */

export const AUTH_COOKIE_NAME = 'bt_token';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  expires: new Date('9999-12-31T23:59:59.999Z'),
  path: '/',
};

export function getAuthToken(req: {
  headers: { authorization?: string | string[] };
  cookies?: Record<string, string | undefined>;
}): string | undefined {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] || req.cookies?.['tt_token'];
  if (cookieToken) {
    return cookieToken;
  }
  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7);
  }
  return undefined;
}
