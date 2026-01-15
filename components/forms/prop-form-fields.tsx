"use client";

import { UseFormReturn } from "react-hook-form";
import { FileText, Hash, Tag, Trophy, Users } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, Competition } from "@/types/db_types";

interface PropFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  categories: Category[];
  competitions: Competition[];
  initialUserId?: number;
  canEditPublicProps: boolean;
}

export function PropFormFields({
  form,
  categories,
  competitions,
  initialUserId,
  canEditPublicProps,
}: PropFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="text"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proposition Text
              <span className="text-xs text-muted-foreground font-normal">
                (Markdown supported)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="text-sm min-h-24 resize-none"
                placeholder="Enter the proposition text here. Be clear and specific about what you're asking people to forecast. Markdown formatting (links, bold, italic) is supported."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Notes (Optional)
              <span className="text-xs text-muted-foreground font-normal">
                (Markdown supported)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? undefined}
                className="text-sm min-h-20 resize-none"
                placeholder="Add any additional context, clarification, or background information. Markdown formatting (links, bold, italic) is supported."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => {
          return (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </FormLabel>
              <Select
                {...field}
                value={field.value === null ? "null" : String(field.value)}
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : Number(value))
                }
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="competition_id"
        render={({ field }) => {
          return (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Competition
              </FormLabel>
              <Select
                {...field}
                value={field.value === null ? "null" : String(field.value)}
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : Number(value))
                }
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {competitions.map((competition) => (
                    <SelectItem
                      key={competition.id}
                      value={String(competition.id)}
                    >
                      {competition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="user_id"
        render={({ field }) => {
          return (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Visibility
              </FormLabel>
              <Select
                {...field}
                value={field.value === null ? "null" : String(field.value)}
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : Number(value))
                }
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {initialUserId && (
                    <SelectItem value={String(initialUserId)}>
                      Personal
                    </SelectItem>
                  )}
                  {canEditPublicProps && (
                    <SelectItem value="null">Public</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </>
  );
}
