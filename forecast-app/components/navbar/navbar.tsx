import ThemeToggle from './theme-toggle';
import { UserStatus } from './user-status';

export default async function NavBar() {
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