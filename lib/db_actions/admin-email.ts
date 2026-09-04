"use server";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/database";
import { getUserFromCookies } from "@/lib/get-user";
import { logger } from "@/lib/logger";
import { BODY_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "@/lib/manual-email";
import { publishEvent } from "@/lib/pubsub/client";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

/**
 * Sends one hand-written email to one user, from the admin Users page.
 *
 * This publishes to Pub/Sub and comms does the sending, the same path every
 * other notification takes — haruspex has no Resend credentials of its own and
 * deliberately keeps it that way, so the fleet has a single sender and a single
 * from address.
 *
 * The consequence is that success here means *queued*, not *delivered*. A
 * Resend rejection surfaces in comms' logs, not to the admin, so the UI says
 * queued rather than sent.
 *
 * Unlike the automated notifications, this is awaited rather than
 * fire-and-forget: the admin chose to send it and needs to know if it did not
 * go out.
 */
export async function sendManualEmail({
  userId,
  subject,
  body,
}: {
  userId: number;
  subject: string;
  body: string;
}): Promise<ServerActionResult<{ email: string }>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Sending manual email", {
    currentUserId: currentUser?.id,
    targetUserId: userId,
  });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to send a manual email");
      return error(
        "You must be logged in to send email",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // The /admin layout already blocks non-admins from the page, but a server
    // action is reachable without it.
    if (!currentUser.is_admin) {
      logger.warn("Non-admin attempt to send a manual email", {
        userId: currentUser.id,
        targetUserId: userId,
      });
      return error("Only admins can send email", ERROR_CODES.UNAUTHORIZED);
    }

    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || !trimmedBody) {
      return error(
        "Subject and body are both required",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    if (trimmedSubject.length > SUBJECT_MAX_LENGTH) {
      return error(
        `Subject must be ${SUBJECT_MAX_LENGTH} characters or fewer`,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    if (trimmedBody.length > BODY_MAX_LENGTH) {
      return error(
        `Body must be ${BODY_MAX_LENGTH} characters or fewer`,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // v_users, like every other read in users.ts.
    const recipient = await db
      .selectFrom("v_users")
      .select(["name", "email"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!recipient) {
      return error("User not found", ERROR_CODES.NOT_FOUND);
    }
    // Typed non-null, but an empty string would mean silently addressing
    // nobody, so it is worth refusing rather than publishing.
    if (!recipient.email.trim()) {
      return error(
        "That user has no email address on file",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Minted here rather than left to publishEvent so it can go in our own
    // log line too: that is what joins this record to comms' record of the
    // Resend message.
    const correlationId = randomUUID();
    await publishEvent({
      event_type: "admin.manual_email",
      source: "forecasting",
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      notify: [{ email: recipient.email, name: recipient.name }],
      data: { subject: trimmedSubject, body: trimmedBody },
    });

    // Deliberately no subject or body in the log line: this is someone's
    // correspondence, and who-emailed-whom is the part worth keeping.
    logger.info("Manual email queued", {
      correlationId,
      senderId: currentUser.id,
      targetUserId: userId,
      subjectLength: trimmedSubject.length,
      bodyLength: trimmedBody.length,
      duration: Date.now() - startTime,
    });

    return success({ email: recipient.email });
  } catch (err) {
    logger.error("Failed to queue manual email", err as Error, {
      senderId: currentUser?.id,
      targetUserId: userId,
      duration: Date.now() - startTime,
    });
    return error("Failed to send email", ERROR_CODES.UNKNOWN_ERROR);
  }
}
