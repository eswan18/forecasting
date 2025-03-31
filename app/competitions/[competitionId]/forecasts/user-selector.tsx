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
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
}

export default function UserSelector(
  { users, selectedUserId, redirectOnSelect }: {
    users: User[];
    selectedUserId: number | undefined;
    redirectOnSelect?: (userId: number | undefined) => Promise<string>;
  },
) {
  const router = useRouter();
  return (
    <div className="flex flex-row gap-2 mt-2">
      <Select
        value={selectedUserId !== undefined
          ? selectedUserId.toString()
          : "undefined"}
        onValueChange={async (userId) => {
          if (redirectOnSelect === undefined) {
            return;
          }
          if (userId === "undefined") {
            router.push(await redirectOnSelect(undefined));
          } else {
            router.push(await redirectOnSelect(parseInt(userId, 10)));
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Users</SelectLabel>
            <SelectItem value="undefined">
              All users
            </SelectItem>
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
    </div>
  );
}
