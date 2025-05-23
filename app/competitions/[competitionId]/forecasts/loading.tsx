import { Loader2 } from "lucide-react";

export default async function Loading() {
  return (
    <div className="flex justify-center items-center h-[32rem]">
      <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
    </div>
  );
}
