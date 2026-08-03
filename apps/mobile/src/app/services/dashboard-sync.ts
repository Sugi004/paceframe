import type { User } from 'firebase/auth';
import { mergeDashboardState, type DashboardState } from '@paceframe/shared';
import { supabase } from '../../lib/supabase';

export async function ensureRemoteUser(user: User) {
  const { error } = await supabase.from('users').upsert(
    {
      id: user.uid,
      email: user.email ?? null
    },
    {
      onConflict: 'id'
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadRemoteDashboard(user: User) {
  const { data, error } = await supabase
    .from('dashboard_states')
    .select('payload')
    .eq('user_id', user.uid)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.payload) {
    return null;
  }

  return mergeDashboardState(data.payload as Partial<DashboardState>);
}

export async function saveRemoteDashboard(user: User, dashboard: DashboardState) {
  const { error } = await supabase.from('dashboard_states').upsert(
    {
      user_id: user.uid,
      payload: dashboard,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'user_id'
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteRemoteUserData(user: User) {
  const { error } = await supabase.from('users').delete().eq('id', user.uid);

  if (error) {
    throw new Error(error.message);
  }
}
