import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logout } from "@/lib/auth";

// A hook that provides the logout functionality with routing
export function useLogout(redirectTo?: string) {
  const router = useRouter();
  const { mutate } = useCurrentUser();

  const doLogout = async () => {
    await logout();
    console.log("Logged out");
    await mutate();
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return doLogout;
}
