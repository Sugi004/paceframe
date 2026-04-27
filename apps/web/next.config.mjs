import fs from 'node:fs';
import path from 'node:path';

function readRootEnv() {
  const envPath = path.resolve(process.cwd(), '../../.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  return raw.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    acc[key] = value;
    return acc;
  }, {});
}

const rootEnv = readRootEnv();

function envValue(key) {
  return process.env[key] ?? rootEnv[key] ?? '';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@paceframe/shared'],
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: envValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: envValue('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: envValue('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: envValue('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    NEXT_PUBLIC_FIREBASE_APP_ID: envValue('NEXT_PUBLIC_FIREBASE_APP_ID'),
    NEXT_PUBLIC_SUPABASE_URL: envValue('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: envValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envValue('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
};

export default nextConfig;
