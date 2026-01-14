"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserUpdate, VUser } from "@/types/db_types";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateUser } from "@/lib/db_actions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountDetails() {
  const { user, isLoading, mutate } = useCurrentUser();
  async function mutateUser(updatedUser: UserUpdate) {
    if (user) {
      mutate({ ...user, ...updatedUser });
    }
  }
  return (
    <div className="mt-4 space-y-12">
      {user && (
        <>
          {!isLoading && (
            <UserDetailsSection initialUser={user} mutateUser={mutateUser} />
          )}
          <AccountSettingsSection email={user.email} />
        </>
      )}
    </div>
  );
}

const userDetailsFormSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z \-]+$/, "Must contain only letters, hyphens, and spaces")
    .min(2)
    .max(30),
});

function UserDetailsSection({
  initialUser,
  mutateUser,
}: {
  initialUser: VUser;
  mutateUser: (updatedUser: UserUpdate) => void;
}) {
  const form = useForm<z.infer<typeof userDetailsFormSchema>>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: { name: initialUser.name },
  });

  const updateUserAction = useServerAction(updateUser, {
    successMessage: "Profile updated successfully",
    onSuccess: () => {
      const values = form.getValues();
      form.reset(values);
      mutateUser(values);
    },
  });

  async function onSubmit(values: z.infer<typeof userDetailsFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }

    await updateUserAction.execute({ id: initialUser.id, user: values });
  }

  return (
    <div>
      <h2 className="text-lg text-muted-foreground mb-4">User Details</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <AccountFormItem>
                <AccountFormLabel>Name</AccountFormLabel>
                <AccountFormInputControl>
                  <Input {...field} />
                </AccountFormInputControl>
                <AccountFormMessage />
              </AccountFormItem>
            )}
          />
          {updateUserAction.isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              <div className="col-start-2 col-span-2 flex flex-row justify-center">
                <Spinner />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <Button
                type="submit"
                disabled={!form.formState.isDirty}
                className="col-start-2 col-span-2"
              >
                Update
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

function AccountSettingsSection({ email }: { email: string }) {
  const router = useRouter();

  function handleManageAccount() {
    router.push("/oauth/account-settings");
  }

  return (
    <div>
      <h2 className="text-lg text-muted-foreground mb-4">Account Settings</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4 items-center">
          <AccountLabel>Email</AccountLabel>
          <div className="col-span-2 text-sm text-muted-foreground">
            {email}
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Your email, password, and other account settings are managed by the
            identity provider.
          </p>
          <Button
            onClick={handleManageAccount}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage Account Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountFormItem({ children }: { children: React.ReactNode }) {
  return (
    <FormItem className="grid grid-cols-4 gap-4 space-y-0 w-full">
      {children}
    </FormItem>
  );
}

function AccountFormLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">
      {children}
    </FormLabel>
  );
}

function AccountLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">
      {children}
    </Label>
  );
}

function AccountFormInputControl({ children }: { children: React.ReactNode }) {
  return <FormControl className="col-span-2">{children}</FormControl>;
}

function AccountFormMessage() {
  return <FormMessage className="col-start-2 col-span-2" />;
}
