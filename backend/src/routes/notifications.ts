import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { serializeNotification } from "../serializers";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications: notifications.map(serializeNotification) });
  })
);

router.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({ where: { userId: req.user!.userId, read: false } });
    res.json({ count });
  })
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.userId) throw new HttpError(404, "Notification not found");

    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
    res.json({ notification: serializeNotification(updated) });
  })
);

router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
    res.status(204).end();
  })
);

export default router;
