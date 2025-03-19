"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateInviteToken } from "@/lib/db_actions/invite-tokens";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InviteUserButton({ className }: { className?: string }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  async function generateInviteCode() {
    setLoading(true);
    const inviteToken = await generateInviteToken();
    setInviteCode(inviteToken);
    setLoading(false);
  }
  async function copyInviteLink() {
    if (!inviteCode) return;
    const host = window.location.host;
    const protocol = window.location.protocol;
    const url = `${protocol}//${host}/register?token=${inviteCode}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "The invite link has been copied to your clipboard.",
    })
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className={className}>Create Invite Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        {loading
          ? (
            <div className="w-full flex justify-center">
              <LoaderCircle className="animate-spin" />
            </div>
          )
          : (
            <Button disabled={inviteCode !== null} onClick={generateInviteCode}>
              Generate Invite Code
            </Button>
          )}
        <Input value={inviteCode ?? undefined} readOnly />
        {inviteCode && (
          <Button onClick={copyInviteLink}>
            Copy Link to Clipboard
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
