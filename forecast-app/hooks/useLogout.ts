import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { revalidateOnUserChange } from '@/lib/revalidate-on-user-change';
import { logout } from '@/lib/auth';

// A hook that provides the logout functionality with routing
export function useLogout(redirectTo?: string) {
  const router = useRouter();
  const { mutate } = useCurrentUser();

  const doLogout = async () => {
    await logout();
    mutate();
    revalidateOnUserChange();
    redirectTo && router.push(redirectTo);
  };

  return doLogout;
}