import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  userTasksTable,
  tasksTable,
  userChallengesTable,
  challengesTable,
  studySessionsTable,
} from "@workspace/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const todayCompletions = await db
    .select({ count: sql<number>`count(*)` })
    .from(userTasksTable)
    .where(and(eq(userTasksTable.userId, userId), gte(userTasksTable.completedAt, today)));

  const tasksCompletedToday = Number(todayCompletions[0]?.count ?? 0);

  const allActiveTasks = await db.select({ id: tasksTable.id }).from(tasksTable).where(eq(tasksTable.isActive, true));
  const completedTaskIds = await db.select({ taskId: userTasksTable.taskId }).from(userTasksTable).where(eq(userTasksTable.userId, userId));
  const completedSet = new Set(completedTaskIds.map((t) => t.taskId));
  const pendingTasks = allActiveTasks.filter((t) => !completedSet.has(t.id)).length;

  const taskRewards = await db
    .select({ totalReward: sql<number>`COALESCE(sum(${tasksTable.reward}), 0)` })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(eq(userTasksTable.userId, userId));

  const totalRewardsEarned = Number(taskRewards[0]?.totalReward ?? 0);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const userWeeklyPoints = await db
    .select({ weeklyPoints: sql<number>`COALESCE(sum(${tasksTable.points}), 0)` })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(and(eq(userTasksTable.userId, userId), gte(userTasksTable.completedAt, oneWeekAgo)));

  const myWeeklyPoints = Number(userWeeklyPoints[0]?.weeklyPoints ?? 0);

  const higherWeeklyCount = await db
    .select({ count: sql<number>`count(distinct ${userTasksTable.userId})` })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(gte(userTasksTable.completedAt, oneWeekAgo))
    .having(sql`sum(${tasksTable.points}) > ${myWeeklyPoints}`);

  const weeklyRank = Number(higherWeeklyCount[0]?.count ?? 0) + 1;

  const todayChallenge = await db.select().from(challengesTable).where(eq(challengesTable.date, todayStr)).limit(1);
  let challengeCompleted = false;
  if (todayChallenge.length > 0) {
    const completed = await db.select().from(userChallengesTable).where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.challengeId, todayChallenge[0].id))).limit(1);
    challengeCompleted = completed.length > 0;
  }

  const recentActivity = await db
    .select({ id: userTasksTable.id, taskId: userTasksTable.taskId, taskTitle: tasksTable.title, category: tasksTable.category, reward: tasksTable.reward, points: tasksTable.points, completedAt: userTasksTable.completedAt })
    .from(userTasksTable)
    .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
    .where(eq(userTasksTable.userId, userId))
    .orderBy(desc(userTasksTable.completedAt))
    .limit(5);

  // Study minutes today
  const studyResult = await db
    .select({ total: sql<number>`COALESCE(sum(${studySessionsTable.durationSeconds}), 0)` })
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.userId, userId), eq(studySessionsTable.sessionDate, todayStr)));

  const studyMinutesToday = Math.floor(Number(studyResult[0]?.total ?? 0) / 60);

  res.json({
    totalPoints: user.points,
    currentStreak: user.streak,
    tasksCompletedToday,
    pendingTasks,
    totalRewardsEarned,
    weeklyRank,
    challengeCompleted,
    recentActivity,
    studyMinutesToday,
    streamName: user.stream ?? null,
  });
});

export default router;
