import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  {
    accessToken: async () => (auth?.currentUser ? await auth.currentUser.getIdToken(false) : null)
  }
);
