export function getSupabaseEnv() {
  const env = process.env.APP_ENV || 'development';

  if (env === 'production') {
    return {
      url: process.env.SUPABASE_URL_PRD || process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY_PRD || process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  return {
    url: process.env.SUPABASE_URL_DEV || process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
