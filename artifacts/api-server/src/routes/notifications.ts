import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications);
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const notificationId = parseInt(req.params.id);

  if (isNaN(notificationId)) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      and(
        eq(notificationsTable.id, notificationId),
        eq(notificationsTable.userId, userId)
      )
    );

  res.json({ success: true, message: "Notification marked as read" });
});

router.post("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));

  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
