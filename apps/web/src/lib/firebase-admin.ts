import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getServerEnvValue } from './server-env';

let adminApp: App | null = null;

function getPrivateKey() {
  return getServerEnvValue('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');
}

function getFirebaseAdminConfig() {
  const projectId = getServerEnvValue('FIREBASE_ADMIN_PROJECT_ID') || getServerEnvValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const clientEmail = getServerEnvValue('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function hasFirebaseAdminConfig() {
  return Boolean(getFirebaseAdminConfig());
}

export function getFirebaseAdminAuth() {
  if (adminApp) {
    return getAuth(adminApp);
  }

  const config = getFirebaseAdminConfig();
  if (!config) {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in the root .env file.'
    );
  }

  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(config)
      });

  return getAuth(adminApp);
}
