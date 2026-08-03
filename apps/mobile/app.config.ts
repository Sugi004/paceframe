import fs from 'fs';
import path from 'path';
import type { ExpoConfig } from 'expo/config';

function readRootEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, 'utf8');
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

const rootEnv = readRootEnv();

function envValue(key: string) {
  return process.env[key] ?? rootEnv[key] ?? '';
}

const config: ExpoConfig = {
  name: 'Paceframe',
  slug: 'paceframe',
  version: '1.0.0',
  description: 'Energy-aware planning, burnout recovery, and AI coaching in one calm mobile system.',
  scheme: 'paceframe',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],
  plugins: [
    [
      'expo-notifications',
      {
        defaultChannel: 'paceframe-reminders'
      }
    ]
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#091221'
  },
  ios: {
    bundleIdentifier: envValue('EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER') || 'com.paceframe.app',
    supportsTablet: true,
    icon: './assets/icon.png'
  },
  android: {
    package: envValue('EXPO_PUBLIC_ANDROID_PACKAGE_NAME') || 'com.paceframe.app',
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      backgroundImage: './assets/adaptive-icon-background.png',
      monochromeImage: './assets/adaptive-icon-foreground.png'
    }
  },
  extra: {
    firebase: {
      apiKey: envValue('EXPO_PUBLIC_FIREBASE_API_KEY'),
      authDomain: envValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: envValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: envValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: envValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: envValue('EXPO_PUBLIC_FIREBASE_APP_ID')
    },
    supabase: {
      url: envValue('EXPO_PUBLIC_SUPABASE_URL'),
      publishableKey: envValue('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || envValue('EXPO_PUBLIC_SUPABASE_ANON_KEY')
    },
    ai: {
      baseUrl: envValue('EXPO_PUBLIC_AI_API_URL')
    },
    web: {
      siteUrl: envValue('EXPO_PUBLIC_SITE_URL')
    },
    notifications: {
      defaultChannel: 'paceframe-reminders'
    }
  }
};

export default config;
