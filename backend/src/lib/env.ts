import 'dotenv/config';

class EnvVarError extends Error {
  constructor(key: string, message?: string) {
    super(
      `${key} → ${message ?? 'Invalid or missing environment variable'}\nat file: @src/lib/env.ts`
    );
    this.name = 'EnvVarError';
  }
}

const loadEnv = (key: string): string => {
  const _key = `TASKMINDS_APP_${key}`;
  const value = process.env[_key];

  if (!value) {
    throw new EnvVarError(_key, 'Value is not defined');
  }

  return value;
};

const parseNumber = (key: string): number => {
  const value = loadEnv(key);
  const num = Number(value);

  if (Number.isNaN(num)) {
    throw new EnvVarError(`TASKMINDS_APP_${key}`, 'Must be a valid number');
  }

  return num;
};

const parseEnum = <T extends string>(key: string, allowed: readonly T[]): T => {
  const value = loadEnv(key);

  if (!allowed.includes(value as T)) {
    throw new EnvVarError(
      `TASKMINDS_APP_${key}`,
      `Must be one of: ${allowed.join(', ')}`
    );
  }

  return value as T;
};

const parseCommaArray = (key: string): string[] => {
  return loadEnv(key)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
};

const ENV = {
  NODE_ENV: parseEnum('NODE_ENV', [
    'development',
    'production',
    'test',
  ] as const),

  PORT: parseNumber('PORT'),
  HOST: loadEnv('HOST'),
  DATABASE_URL: loadEnv('DATABASE_URL'),
  CORS_ORIGINS: parseCommaArray('CORS_ORIGINS'),
  isProduction:
    parseEnum('NODE_ENV', ['development', 'production', 'test'] as const) ===
    'production',
  groqApiKey: loadEnv('GROQ_API_KEY'),
};

type Env = typeof ENV;

export { ENV, type Env };
