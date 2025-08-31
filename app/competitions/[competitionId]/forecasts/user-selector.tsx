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
import { useSearchParams } from "next/navigation";

interface User {
  id: number;
  name: string;
}

export default function UserSelector({
  users,
  setUserId,
}: {
  users: User[];
  setUserId: (userId: number | undefined) => void;
}) {
  const selectedUserId = useSearchParams().get("user_id");
  return (
    <Select
      value={selectedUserId !== null ? selectedUserId.toString() : "undefined"}
      onValueChange={(value) => {
        if (value === "undefined") {
          setUserId(undefined);
        } else {
          setUserId(parseInt(value, 10));
        }
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a user" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Users</SelectLabel>
          <SelectItem value="undefined">All users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
