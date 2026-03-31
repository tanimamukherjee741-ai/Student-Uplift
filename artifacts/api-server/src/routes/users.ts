import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  userTasksTable,
  tasksTable,
  userChallengesTable,
  challengesTable,
  notificationsTable,
} from "@workspace/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/users/profile", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const taskCompletions = await db
    .select({ count: sql<number>`count(*)` })
    .from(userTasksTable)
    .where(eq(userTasksTable.userId, userId));

  const challengeCompletions = await db
    .select({ count: sql<number>`count(*)` })
    .from(userChallengesTable)
    .where(eq(userChallengesTable.userId, userId));

  const totalTasksCompleted =
    Number(taskCompletions[0]?.count ?? 0) +
    Number(challengeCompletions[0]?.count ?? 0);

  const taskRewards = await db
    .select({ totalReward: sql<number>`sum(${tasksTable.reward})` })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(eq(userTasksTable.userId, userId));

  const challengeRewards = await db
    .select({
      totalReward: sql<number>`COALESCE(sum(${challengesTable.reward} + ${challengesTable.bonusReward}), 0)`,
    })
    .from(userChallengesTable)
    .innerJoin(
      challengesTable,
      eq(userChallengesTable.challengeId, challengesTable.id)
    )
    .where(eq(userChallengesTable.userId, userId));

  const totalRewardsEarned =
    Number(taskRewards[0]?.totalReward ?? 0) +
    Number(challengeRewards[0]?.totalReward ?? 0);

  // Calculate rank
  const higherPoints = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(sql`${usersTable.points} > ${user.points}`);

  const rank = Number(higherPoints[0]?.count ?? 0) + 1;

  // Weekly points (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyTaskPoints = await db
    .select({ totalPoints: sql<number>`sum(${tasksTable.points})` })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(
      and(
        eq(userTasksTable.userId, userId),
        gte(userTasksTable.completedAt, oneWeekAgo)
      )
    );

  const weeklyPoints = Number(weeklyTaskPoints[0]?.totalPoints ?? 0);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      streak: user.streak,
      lastCheckin: user.lastCheckin,
      createdAt: user.createdAt,
    },
    totalTasksCompleted,
    totalRewardsEarned,
    rank,
    weeklyPoints,
  });
});

router.get("/users/completed-tasks", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const taskCompletions = await db
    .select({
      id: userTasksTable.id,
      taskId: userTasksTable.taskId,
      taskTitle: tasksTable.title,
      category: tasksTable.category,
      reward: tasksTable.reward,
      points: tasksTable.points,
      completedAt: userTasksTable.completedAt,
    })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(eq(userTasksTable.userId, userId))
    .orderBy(desc(userTasksTable.completedAt));

  res.json(taskCompletions);
});

router.post("/users/checkin", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let isNewDay = false;
  let newStreak = user.streak;

  if (!user.lastCheckin) {
    // First check-in
    newStreak = 1;
    isNewDay = true;
  } else {
    const lastCheckinDate = new Date(user.lastCheckin);
    const lastCheckinDay = new Date(
      lastCheckinDate.getFullYear(),
      lastCheckinDate.getMonth(),
      lastCheckinDate.getDate()
    );

    const diffMs = today.getTime() - lastCheckinDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, no change
      isNewDay = false;
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak = user.streak + 1;
      isNewDay = true;
    } else {
      // Streak broken
      newStreak = 1;
      isNewDay = true;
    }
  }

  if (isNewDay) {
    await db
      .update(usersTable)
      .set({ streak: newStreak, lastCheckin: now })
      .where(eq(usersTable.id, userId));

    // Streak milestone notifications
    if (newStreak === 7 || newStreak === 30 || newStreak % 10 === 0) {
      await db.insert(notificationsTable).values({
        userId,
        type: "streak_milestone",
        title: `${newStreak}-Day Streak!`,
        message: `Amazing! You've maintained a ${newStreak}-day streak. Keep it up!`,
        read: false,
      });
    }
  }

  const messages: Record<number, string> = {
    1: "Welcome back! Your streak starts now.",
    2: "2-day streak! You're building momentum.",
    3: "3 days in a row! Great consistency!",
    7: "One week streak! You're on fire!",
    30: "30-day streak! You're unstoppable!",
  };

  const message =
    messages[newStreak] ??
    (isNewDay
      ? `${newStreak}-day streak! Keep going!`
      : "Already checked in today. Come back tomorrow!");

  res.json({ streak: newStreak, message, isNewDay });
});

export default router;
