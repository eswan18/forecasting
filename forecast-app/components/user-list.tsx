import { getUsers } from "@/lib/db_actions";

export default async function UserList() {
  const users = await getUsers();
  return (
    <div>
      {users.map(u => <p key={u.id}>{u.name}</p>)}
    </div>
  )
}