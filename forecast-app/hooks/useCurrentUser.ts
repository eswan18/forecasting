'use client';

import useSWR from 'swr';

import { User } from '@/types/db_types';
import { useState, useEffect } from 'react';

export function useCurrentUser() {
  const { data, error, mutate } = useSWR('/api/user', fetcher);

  return {
    user: data,
    loading: !error && !data,
    error,
    mutate,
  };
}

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });

  if (!res.ok) {
    throw new Error('Not authenticated');
  }

  return res.json();
}