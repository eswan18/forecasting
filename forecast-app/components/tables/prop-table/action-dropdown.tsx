"use client";

import { useState } from "react";
import { AlertTriangle, Edit, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveProp, unresolveProp, updateProp } from "@/lib/db_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { VProp } from "@/types/db_types";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface ActionDropdownProps {
  prop: VProp;
  resolution: boolean | null;
}

export function ActionDropdown({ prop, resolution }: ActionDropdownProps) {
  const actions = resolution !== null
    ? [{
      "label": "Unresolve",
      "onClick": async () => {
        unresolveProp({ propId: prop.prop_id });
      },
    }]
    : [
      {
        label: "Resolve to Yes",
        onClick: async () => {
          resolveProp({ propId: prop.prop_id, resolution: true });
        },
      },
      {
        label: "Resolve to No",
        onClick: async () => {
          resolveProp({ propId: prop.prop_id, resolution: false });
        },
      },
    ];
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Open menu</span>
            <Edit size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {actions.map(({ label, onClick }, i) => (
            <DropdownMenuItem key={i} onClick={onClick}>
              {label}
            </DropdownMenuItem>
          ))}
          <DialogTrigger asChild>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prop</DialogTitle>
        </DialogHeader>
        <EditPropForm initialProp={prop} />
      </DialogContent>
    </Dialog>
  );
}

const formSchema = z.object({
  prop_text: z.string().min(8).max(1000),
});

function EditPropForm({ initialProp }: { initialProp: VProp }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prop_text: initialProp.prop_text },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      await updateProp({
        id: initialProp.prop_id,
        prop: { text: values.prop_text },
      }).then(() => {
        toast({
          title: "Prop Updated!",
        });
      });
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Submission Error",
          description: e.message,
          variant: "destructive",
        });
        setError(e.message);
      } else {
        toast({
          title: "Submission Error",
          description: "An error occurred.",
          variant: "destructive",
        });
        setError("An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="prop_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prop</FormLabel>
              <FormControl>
                <Textarea {...field} className="text-sm min-h-20" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {loading
          ? (
            <Button type="submit" disabled className="w-full">
              <LoaderCircle className="animate-spin" />
            </Button>
          )
          : (
            <Button type="submit" className="w-full">
              Update
            </Button>
          )}
        {error && (
          <Alert
            variant="destructive"
            className="m-4 w-auto flex flex-row justify-start items-center"
          >
            <AlertTriangle className="h-8 w-8 mr-4 inline" />
            <div className="ml-4">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}
      </form>
    </Form>
  );
}
