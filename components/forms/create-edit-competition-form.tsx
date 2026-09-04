"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field, Refusal } from "@/components/form-sheet/form-sheet";
import DatePicker from "@/components/ui/date-picker";
import { useServerAction } from "@/hooks/use-server-action";
import { createCompetition, updateCompetition } from "@/lib/db_actions";
import type { Competition } from "@/types/db_types";

import { competitionFormSchema } from "./competition-form-schema";

type EditableCompetition = Pick<
  Competition,
  | "id"
  | "name"
  | "is_private"
  | "forecasts_open_date"
  | "forecasts_close_date"
  | "end_date"
>;

/**
 * Create or edit a competition. With `initialCompetition` it edits, without it
 * creates.
 *
 * Whether a competition is private is settled once, at creation: it decides
 * whether deadlines belong to the season or to each prop, and props already
 * written against one shape do not survive the other. So the choice is offered
 * as a pair of named options rather than a switch — an admin should read what
 * they are choosing between — and only while creating.
 */
export function CreateEditCompetitionForm({
  initialCompetition,
  onSubmit,
}: {
  initialCompetition?: EditableCompetition;
  onSubmit?: () => void;
}) {
  const nameId = useId();
  const visibilityId = useId();
  const openId = useId();
  const dueId = useId();
  const endId = useId();

  const form = useForm<z.infer<typeof competitionFormSchema>>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: initialCompetition?.name || "",
      is_private: initialCompetition?.is_private ?? false,
      // Convert null to undefined for form compatibility
      forecasts_open_date: initialCompetition?.forecasts_open_date ?? undefined,
      forecasts_close_date:
        initialCompetition?.forecasts_close_date ?? undefined,
      end_date: initialCompetition?.end_date ?? undefined,
    },
  });

  const isPrivate = form.watch("is_private");
  const errors = form.formState.errors;

  const createCompetitionAction = useServerAction(createCompetition, {
    successMessage: "Competition Created!",
    onSuccess: () => onSubmit?.(),
  });

  const updateCompetitionAction = useServerAction(updateCompetition, {
    successMessage: "Competition Updated!",
    onSuccess: () => onSubmit?.(),
  });

  const isLoading =
    createCompetitionAction.isLoading || updateCompetitionAction.isLoading;
  const error = createCompetitionAction.error || updateCompetitionAction.error;

  async function handleSubmit(values: z.infer<typeof competitionFormSchema>) {
    // Build the competition object explicitly to ensure proper values
    const competition = {
      name: values.name,
      is_private: values.is_private,
      // For private competitions, dates should be null/undefined
      // For public competitions, dates are required
      forecasts_open_date: values.is_private
        ? null
        : values.forecasts_open_date,
      forecasts_close_date: values.is_private
        ? null
        : values.forecasts_close_date,
      end_date: values.is_private ? null : values.end_date,
    };

    if (initialCompetition) {
      await updateCompetitionAction.execute({
        id: initialCompetition.id,
        competition,
      });
    } else {
      await createCompetitionAction.execute({ competition });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="hxf">
        <Field
          label="Name"
          htmlFor={nameId}
          error={errors.name?.message}
          hint="What forecasters will see it called."
        >
          <input
            id={nameId}
            type="text"
            autoComplete="off"
            placeholder="2027 Open"
            disabled={isLoading}
            {...form.register("name")}
          />
        </Field>

        {!initialCompetition && (
          <Field label="Who can see it" labelId={visibilityId}>
            <div
              className="choose"
              role="radiogroup"
              aria-labelledby={visibilityId}
            >
              <label htmlFor={`${visibilityId}-public`}>
                <input
                  type="radio"
                  id={`${visibilityId}-public`}
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => form.setValue("is_private", false)}
                  disabled={isLoading}
                />
                <span>
                  <span className="who">Public</span>
                  <span className="what">
                    {" "}
                    — anyone can forecast, on season-wide deadlines
                  </span>
                </span>
              </label>
              <label htmlFor={`${visibilityId}-private`}>
                <input
                  type="radio"
                  id={`${visibilityId}-private`}
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => form.setValue("is_private", true)}
                  disabled={isLoading}
                />
                <span>
                  <span className="who">Private</span>
                  <span className="what">
                    {" "}
                    — invited members only, with a deadline per prop
                  </span>
                </span>
              </label>
            </div>
          </Field>
        )}

        {!isPrivate && (
          <>
            <Field
              label="Forecasts open"
              labelId={openId}
              hint="When the season starts taking forecasts."
              error={errors.forecasts_open_date?.message}
            >
              <DatePicker
                value={form.watch("forecasts_open_date") ?? undefined}
                onChange={(d) =>
                  form.setValue("forecasts_open_date", d as Date)
                }
                timeZone="UTC"
                disabled={isLoading}
              />
            </Field>

            <Field
              label="Forecasts due"
              labelId={dueId}
              hint="After this, no more forecasts and scoring begins."
              error={errors.forecasts_close_date?.message}
            >
              <DatePicker
                value={form.watch("forecasts_close_date")}
                onChange={(d) =>
                  form.setValue("forecasts_close_date", d as Date)
                }
                timeZone="UTC"
                disabled={isLoading}
              />
            </Field>

            <Field
              label="Season ends"
              labelId={endId}
              hint="When every prop should be settled and the result stands."
              error={errors.end_date?.message}
            >
              <DatePicker
                value={form.watch("end_date")}
                onChange={(d) => form.setValue("end_date", d as Date)}
                timeZone="UTC"
                disabled={isLoading}
              />
            </Field>
          </>
        )}

        {error && <Refusal message={error} />}

        <div className="submitrow">
          <button type="submit" className="submit" disabled={isLoading}>
            {isLoading
              ? initialCompetition
                ? "Saving…"
                : "Creating…"
              : initialCompetition
                ? "Save changes"
                : "Create competition"}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
