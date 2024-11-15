"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";

interface User {
  id: number;
  name: string;
}

export default function UserYearSelector(
  { users, selectedUserId, years, selectedYear }: {
    users: User[];
    selectedUserId: number;
    years: number[];
    selectedYear: number;
  },
) {
  const selectedUserName = users.find((user) => user.id === selectedUserId)
    ?.name;
  return (
    <Select
      value={String(selectedUserId.toString())}
      onValueChange={(userId) => {
        redirect(`/forecasts/${selectedYear}/user/${userId}`);
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder={selectedUserName} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Users</SelectLabel>
          {users.map((user) => (
            <SelectItem
              key={user.id}
              value={user.id.toString()}
            >
              {user.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
