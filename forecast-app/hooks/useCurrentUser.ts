'use client';

import { VUser } from '@/types/db_types';
import useSWR from 'swr';

export function useCurrentUser() {
  const { data: user, error, mutate } = useSWR('/api/user', fetcher);

  return {
    user,
    loading: !error && !user,
    error,
    mutate,
  };
}

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });

  if (!res.ok) {
    throw new Error('Not authenticated');
  }

  const payload = await res.json();
  if ('user' in payload) {
    return payload.user as VUser;
  } else {
    throw new Error('Invalid response from server');
  }
}