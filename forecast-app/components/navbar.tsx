export default function NavBar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-primary-foreground text-primary-background">
      <h1 className="text-lg font-bold">Forecasting</h1>
      <ul className="flex space-x-4">
        <li>
          <a href="/scores/2024">Scores</a>
        </li>
        <li>
          <a href="/props/2024">Props</a>
        </li>
      </ul>
    </nav>
  )
}