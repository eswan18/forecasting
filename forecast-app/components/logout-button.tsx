'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return <Button variant="outline" onClick={handleLogout}>Logout <LogOut /></Button>;
}