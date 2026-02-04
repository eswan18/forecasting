import { z } from "zod";

export const competitionFormSchema = z
  .object({
    name: z.string().min(8).max(1000),
    is_private: z.boolean(),
    forecasts_open_date: z.date().optional(),
    forecasts_close_date: z.date().optional(),
    end_date: z.date().optional(),
  })
  .superRefine((values, ctx) => {
    const {
      is_private,
      forecasts_open_date,
      forecasts_close_date,
      end_date,
    } = values;

    // Private competitions don't require dates (deadlines are per-prop)
    if (is_private) {
      return;
    }

    // Public competitions require all dates
    if (!forecasts_open_date) {
      ctx.addIssue({
        code: "custom",
        message: "Open date is required for public competitions",
        path: ["forecasts_open_date"],
      });
    }
    if (!forecasts_close_date) {
      ctx.addIssue({
        code: "custom",
        message: "Close date is required for public competitions",
        path: ["forecasts_close_date"],
      });
    }
    if (!end_date) {
      ctx.addIssue({
        code: "custom",
        message: "End date is required for public competitions",
        path: ["end_date"],
      });
    }

    // Only validate ordering if all dates are present
    if (forecasts_open_date && forecasts_close_date && end_date) {
      if (forecasts_open_date >= forecasts_close_date) {
        ctx.addIssue({
          code: "custom",
          message: "Open date must be before close date",
          path: ["forecasts_open_date"],
        });
        ctx.addIssue({
          code: "custom",
          message: "Close date must be after open date",
          path: ["forecasts_close_date"],
        });
      }

      if (forecasts_close_date >= end_date) {
        ctx.addIssue({
          code: "custom",
          message: "Close date must be before end date",
          path: ["forecasts_close_date"],
        });
        ctx.addIssue({
          code: "custom",
          message: "End date must be after close date",
          path: ["end_date"],
        });
      }
    }
  });
