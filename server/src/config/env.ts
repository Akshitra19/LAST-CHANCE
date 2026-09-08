import 'dotenv/config';

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return 3000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function readOptional(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

const supabaseUrl = readOptional(process.env.SUPABASE_URL);
const supabaseSecretKey = readOptional(process.env.SUPABASE_SECRET_KEY);
const supabaseSecretKeyValid = supabaseSecretKey?.startsWith('sb_secret_') ?? false;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: readPort(process.env.PORT),
  clientOrigin: readOptional(process.env.CLIENT_ORIGIN) ?? 'http://localhost:4173',
  supabaseUrl,
  supabaseSecretKey,
  supabaseSecretKeyValid,
  supabaseConfigured: Boolean(supabaseUrl && supabaseSecretKey && supabaseSecretKeyValid)
} as const;
