import { getAvgScoreByUser, getAvgScoreByUserAndCategory, getForecasts, getUsers } from "@/lib/db_actions";

export default async function UserList() {
  const users = await getUsers();
  const forecasts = await getForecasts();
  return (
    <div>
      {users.map(u => <p key={u.id}>{u.name}</p>)}
    </div>
  )
}