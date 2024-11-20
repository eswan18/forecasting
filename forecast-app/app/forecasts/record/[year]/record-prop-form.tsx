"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VProp } from "@/types/db_types";

const formSchema = z.object({
  forecast: z.number().min(0).max(1),
});

export function RecordPropForm({ prop }: { prop: VProp }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  return (
    <Form {...form}>
      <form>
        <div className="grid grid-cols-6 grid-flow-col content-end gap-y-2">
          <span className="col-span-5 text-sm mr-2">{prop.prop_text}</span>
          <FormField
            control={form.control}
            name="forecast"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
