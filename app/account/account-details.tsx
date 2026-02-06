"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ExternalLink, User2 } from "lucide-react";
import Image from "next/image";
export function AccountDetails({ idpBaseUrl }: { idpBaseUrl?: string }) {
  const { user } = useCurrentUser();
  return (
    <div className="mt-4 space-y-12">
      {user && (
        <AccountSettingsSection email={user.email} username={user.username} name={user.name} pictureUrl={user.picture_url} idpBaseUrl={idpBaseUrl} />
      )}
    </div>
  );
}

function AccountSettingsSection({
  email,
  username,
  name,
  pictureUrl,
  idpBaseUrl,
}: {
  email: string;
  username: string | null;
  name: string | null;
  pictureUrl: string | null;
  idpBaseUrl?: string;
}) {
  function getAccountSettingsUrl() {
    if (idpBaseUrl) {
      const normalizedBaseUrl = idpBaseUrl.replace(/\/+$/, "");
      return `${normalizedBaseUrl}/oauth/account-settings`;
    }
    return undefined;
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {pictureUrl ? (
            <Image
              src={pictureUrl}
              alt="Your avatar"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full border border-border bg-muted flex items-center justify-center">
              <User2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            {username && <p className="font-medium">{username}</p>}
            {name && <p className="text-sm text-muted-foreground">{name}</p>}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Account details are managed by the identity provider.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <a href={getAccountSettingsUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Account Details
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
