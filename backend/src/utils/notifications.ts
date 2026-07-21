import { prisma } from "../db";
import type { NotificationType } from "./enums";

// Best-effort: notifications are a side effect of some primary action (an
// application was accepted, a document was reviewed, ...). A failure here
// must never fail that primary action, so callers should not await this
// inside a transaction or let it bubble past a try/catch.
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data: data ? JSON.stringify(data) : undefined },
    });
  } catch (err) {
    console.error("Failed to create notification", { userId, type, err });
  }
}
