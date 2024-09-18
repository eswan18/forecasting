import ThemeToggle from './theme-toggle';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from  '@/lib/database';
import { Login } from '@/types/db_types';

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-primary-foreground text-primary-background">
      <h2 className="text-lg font-bold">Forecasting</h2>
      <div className='flex flex-row gap-4 items-center justify-end'>
      <ul className="flex space-x-4">
        <li>
          <a href="/scores/2024">Scores</a>
        </li>
        <li>
          <a href="/props/2024">Props</a>
        </li>
      </ul>
      <UserStatus />
      <ThemeToggle />
      </div>
    </nav>
  )
}

async function UserStatus() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return <a href="/login">Login</a>;
  }

  const login = await getLoginFromToken(token);


  return login ? (
    <div>
      <span>{login.username}</span>
    </div>
  ) : (
    <a href="/login">Login</a>
  );
}

async function getLoginFromToken(token: string): Promise<Login | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { loginId: number };
    const user = await db
      .selectFrom('logins')
      .selectAll()
      .where('id', '=', decoded.loginId)
      .executeTakeFirst();

    return user || null;
  } catch {
    return null;
  }
}