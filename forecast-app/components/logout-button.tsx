'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
    });
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}