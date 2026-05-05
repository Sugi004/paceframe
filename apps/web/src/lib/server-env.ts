import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');

  return raw.split('\n').reduce<Record<string, string>>((acc, line) => {
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

function loadRootEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env')
  ];

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  return envPath ? parseEnvFile(envPath) : {};
}

export function getServerEnvValue(key: string) {
  return process.env[key] ?? loadRootEnv()[key] ?? '';
}
