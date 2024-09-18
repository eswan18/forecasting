'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function LogoutButton() {
  const router = useRouter();
  const { mutate } = useCurrentUser();

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
    });
    // Revalidate the user after logout.
    mutate();
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}