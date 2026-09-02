"use client";

import { useId } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FileText,
  Hash,
  List,
  ListChecks,
  Tag,
  Trophy,
  Users,
} from "lucide-react";
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
import {
  isChoiceKind,
  PROP_KIND_LABELS,
  PROP_KINDS,
  type PropKind,
} from "@/lib/prop-kind";
import { Category, Competition } from "@/types/db_types";
import { PropFormValues } from "./create-edit-prop-form";
import { OptionsEditor } from "./options-editor";
import { defaultOptionFields } from "./prop-form-schema";

interface PropFormFieldsProps {
  form: UseFormReturn<PropFormValues>;
  categories: Category[];
  competitions: Competition[];
  initialUserId?: number;
  canEditPublicProps: boolean;
  /** The kind is fixed at creation, so editing shows it read-only. */
  isEditing: boolean;
}

export function PropFormFields({
  form,
  categories,
  competitions,
  initialUserId,
  canEditPublicProps,
  isEditing,
}: PropFormFieldsProps) {
  const kind = form.watch("kind");
  const optionsLabelId = useId();

  // `refineKindOptions` puts every option complaint on the `options` path, so
  // the messages belong to the list as a whole rather than to one row.
  const optionsError = form.formState.errors.options;
  const optionErrors = [
    optionsError?.message,
    optionsError?.root?.message,
  ].filter((message): message is string => Boolean(message));

  function handleKindChange(nextKind: PropKind) {
    if (isChoiceKind(nextKind)) {
      if (form.getValues("options").length === 0) {
        form.setValue("options", defaultOptionFields());
      }
    } else {
      form.setValue("options", []);
    }
    // Whatever the old options were, any complaint about them is now stale.
    form.clearErrors("options");
  }

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
        name="kind"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Type
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                const nextKind = value as PropKind;
                field.onChange(nextKind);
                handleKindChange(nextKind);
              }}
              disabled={isEditing}
            >
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROP_KINDS.map((propKind) => (
                  <SelectItem key={propKind} value={propKind}>
                    {PROP_KIND_LABELS[propKind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isEditing && isChoiceKind(kind) && (
        <FormField
          control={form.control}
          name="options"
          render={({ field }) => (
            <FormItem className="space-y-2">
              {/* The options editor is a group of inputs rather than one
                  labelable control, so this label names the group by id
                  instead of pointing `htmlFor` at an element that isn't
                  there. */}
              <FormLabel
                id={optionsLabelId}
                htmlFor={undefined}
                className="text-sm font-medium flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Options
                <span className="text-xs text-muted-foreground font-normal">
                  (in the order forecasters see them)
                </span>
              </FormLabel>
              <OptionsEditor
                value={field.value.map((option) => option.text)}
                onChange={(labels) =>
                  field.onChange(labels.map((text) => ({ text })))
                }
                errors={optionErrors}
                ariaLabelledBy={optionsLabelId}
              />
            </FormItem>
          )}
        />
      )}

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
