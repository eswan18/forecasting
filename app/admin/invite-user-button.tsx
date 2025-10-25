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
import { Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function InviteUserButton({ className }: { className?: string }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const inviteLink = inviteCode && makeInviteLink(inviteCode);

  async function generateInviteCode() {
    setLoading(true);
    const inviteToken = await generateInviteToken({ notes });
    setInviteCode(inviteToken);
    setLoading(false);
  }
  const handleCopyInviteLink = () => {
    if (inviteLink) {
      copyLink(inviteLink);
    }
    toast({
      title: "Link copied!",
      description: "The invite link has been copied to your clipboard.",
    });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className={className}>
          Create Invite Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <div className="w-full flex justify-center">
          {loading ? (
            <Spinner />
          ) : (
            inviteCode === null && (
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Who is this for?"
                  />
                </div>
                <Button
                  disabled={inviteCode !== null || notes.length === 0}
                  onClick={generateInviteCode}
                >
                  Generate Invite
                </Button>
              </div>
            )
          )}
        </div>
        {inviteCode && (
          <Card className="mt-4 p-4">
            <CardContent className="flex flex-col justify-center items-center gap-y-4">
              <div className="flex flex-col gap-y-2 w-full">
                <Label>Invite Link</Label>
                <div className="flex flex-row items-center justify-center flex-nowrap">
                  <Input value={inviteLink ?? ""} disabled />
                  <Button
                    onClick={handleCopyInviteLink}
                    className="gap-x-2 mx-4"
                  >
                    <span className="hidden sm:inline">Copy</span>
                    <Clipboard />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}

const makeInviteLink = (code: string) => {
  if (!code) return "";
  const host = window.location.host;
  const protocol = window.location.protocol;
  return `${protocol}//${host}/register?token=${code}`;
};

async function copyLink(link: string) {
  if (!link) return;
  await navigator.clipboard.writeText(link);
}
