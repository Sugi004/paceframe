import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabase?: {
    url?: string;
    publishableKey?: string;
  };
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabase?.url ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabase?.publishableKey ?? '',
  {
    accessToken: async () => (auth?.currentUser ? await auth.currentUser.getIdToken(false) : null)
  }
);
