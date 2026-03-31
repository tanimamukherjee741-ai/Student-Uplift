import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  userTasksTable,
  tasksTable,
} from "@workspace/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/leaderboard", requireAuth, async (req, res) => {
  const currentUserId = (req.session as any).userId;
  const period = (req.query.period as string) ?? "weekly";

  let entries: any[] = [];

  if (period === "weekly") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyPoints = await db
      .select({
        userId: userTasksTable.userId,
        weeklyPoints: sql<number>`COALESCE(sum(${tasksTable.points}), 0)`,
        tasksCompleted: sql<number>`count(${userTasksTable.id})`,
      })
      .from(userTasksTable)
      .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
      .where(gte(userTasksTable.completedAt, oneWeekAgo))
      .groupBy(userTasksTable.userId)
      .orderBy(desc(sql`sum(${tasksTable.points})`))
      .limit(50);

    const userIds = weeklyPoints.map((wp) => wp.userId);

    if (userIds.length > 0) {
      const users = await db
        .select()
        .from(usersTable)
        .where(sql`${usersTable.id} = ANY(${userIds})`);

      const userMap = new Map(users.map((u) => [u.id, u]));

      entries = weeklyPoints.map((wp, index) => {
        const user = userMap.get(wp.userId);
        return {
          rank: index + 1,
          userId: wp.userId,
          name: user?.name ?? "Unknown",
          points: Number(wp.weeklyPoints),
          streak: user?.streak ?? 0,
          tasksCompleted: Number(wp.tasksCompleted),
          isCurrentUser: wp.userId === currentUserId,
        };
      });
    }
  } else {
    // All time
    const allTime = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        points: usersTable.points,
        streak: usersTable.streak,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.points))
      .limit(50);

    const taskCounts = await db
      .select({
        userId: userTasksTable.userId,
        count: sql<number>`count(*)`,
      })
      .from(userTasksTable)
      .groupBy(userTasksTable.userId);

    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.userId, Number(tc.count)])
    );

    entries = allTime.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      points: user.points,
      streak: user.streak,
      tasksCompleted: taskCountMap.get(user.id) ?? 0,
      isCurrentUser: user.id === currentUserId,
    }));
  }

  // Find current user's rank
  const currentUserEntry = entries.find((e) => e.isCurrentUser);
  const currentUserRank = currentUserEntry?.rank ?? null;

  res.json({ entries, currentUserRank, period });
});

export default router;
