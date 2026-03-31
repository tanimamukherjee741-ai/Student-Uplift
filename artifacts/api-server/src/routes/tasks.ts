import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable, userTasksTable, usersTable, notificationsTable } from "@workspace/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/tasks", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { category } = req.query as { category?: string };

  const allTasks = await db
    .select()
    .from(tasksTable)
    .where(
      category
        ? and(eq(tasksTable.isActive, true), eq(tasksTable.category, category))
        : eq(tasksTable.isActive, true)
    )
    .orderBy(tasksTable.createdAt);

  const taskIds = allTasks.map((t) => t.id);
  const completedByUser =
    taskIds.length > 0
      ? await db
          .select()
          .from(userTasksTable)
          .where(
            and(
              eq(userTasksTable.userId, userId),
              inArray(userTasksTable.taskId, taskIds)
            )
          )
      : [];

  const completedSet = new Set(completedByUser.map((ut) => ut.taskId));
  const completedMap = new Map(
    completedByUser.map((ut) => [ut.taskId, ut.completedAt])
  );

  const tasks = allTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    reward: task.reward,
    points: task.points,
    completed: completedSet.has(task.id),
    completedAt: completedMap.get(task.id) ?? null,
    createdAt: task.createdAt,
  }));

  res.json(tasks);
});

router.post("/tasks/:id/complete", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const taskId = parseInt(req.params.id);

  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const alreadyCompleted = await db
    .select()
    .from(userTasksTable)
    .where(
      and(
        eq(userTasksTable.userId, userId),
        eq(userTasksTable.taskId, taskId)
      )
    )
    .limit(1);

  if (alreadyCompleted.length > 0) {
    res.status(400).json({ error: "Task already completed" });
    return;
  }

  const [completion] = await db
    .insert(userTasksTable)
    .values({ userId, taskId })
    .returning();

  const [updatedUser] = await db
    .update(usersTable)
    .set({
      points: sql`${usersTable.points} + ${task.points}`,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  await db.insert(notificationsTable).values({
    userId,
    type: "reward_earned",
    title: "Task Completed!",
    message: `You earned ₹${task.reward} and ${task.points} points for completing "${task.title}"`,
    read: false,
  });

  res.json({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      reward: task.reward,
      points: task.points,
      completed: true,
      completedAt: completion.completedAt,
      createdAt: task.createdAt,
    },
    pointsEarned: task.points,
    rewardEarned: task.reward,
    newTotalPoints: updatedUser.points,
    message: `You earned ₹${task.reward} and ${task.points} points!`,
  });
});

export default router;
