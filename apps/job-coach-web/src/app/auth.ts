export const AUTH_COOKIE_NAME = "job-coach-auth";

export function isAuthenticated(authCookieValue: string | undefined) {
  return authCookieValue === "1";
}
