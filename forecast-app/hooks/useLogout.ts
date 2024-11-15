import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { revalidateOnUserChange } from '@/lib/revalidate-on-user-change';

async function doLogout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// A hook that provides the logout functionality with routing
export function useLogout(redirectTo?: string) {
  const router = useRouter();
  const { mutate } = useCurrentUser();

  const logout = async () => {
    const success = await doLogout();
    if (success) {
      mutate();
      revalidateOnUserChange();
      redirectTo && router.push(redirectTo);
    }
  };

  return logout;
}