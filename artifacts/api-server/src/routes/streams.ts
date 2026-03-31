import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userTasksTable, tasksTable } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

const PREDEFINED_STREAMS = [
  "Class 9", "Class 10",
  "Class 11 Science", "Class 11 Commerce", "Class 11 Arts",
  "Class 12 Science", "Class 12 Commerce", "Class 12 Arts",
  "B.Tech", "BA", "BCom", "BSc", "BCA", "BBA",
  "MBA", "MCA", "CA Foundation", "CA Intermediate",
  "NEET Prep", "JEE Prep", "UPSC Prep",
];

router.get("/streams", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const [currentUser] = await db.select({ stream: usersTable.stream }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  // Count members per stream
  const streamCounts = await db
    .select({ stream: usersTable.stream, count: sql<number>`count(*)` })
    .from(usersTable)
    .where(sql`${usersTable.stream} IS NOT NULL`)
    .groupBy(usersTable.stream);

  const countMap = new Map(streamCounts.map((s) => [s.stream!, Number(s.count)]));

  const allStreams = [...new Set([...PREDEFINED_STREAMS, ...countMap.keys()])];

  res.json(allStreams.map((stream) => ({
    stream,
    memberCount: countMap.get(stream) ?? 0,
    isJoined: currentUser?.stream === stream,
  })));
});

router.post("/users/join-stream", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { stream } = req.body;

  if (!stream) { res.status(400).json({ error: "Stream is required" }); return; }

  await db.update(usersTable).set({ stream }).where(eq(usersTable.id, userId));

  res.json({ success: true, message: `Joined ${stream} successfully!` });
});

router.get("/streams/:stream/members", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const stream = decodeURIComponent(req.params.stream);

  const members = await db
    .select({ id: usersTable.id, name: usersTable.name, points: usersTable.points, streak: usersTable.streak })
    .from(usersTable)
    .where(eq(usersTable.stream, stream))
    .orderBy(desc(usersTable.points))
    .limit(50);

  const memberIds = members.map((m) => m.id);
  const taskCounts = memberIds.length > 0
    ? await db
        .select({ userId: userTasksTable.userId, count: sql<number>`count(*)` })
        .from(userTasksTable)
        .where(sql`${userTasksTable.userId} = ANY(${memberIds})`)
        .groupBy(userTasksTable.userId)
    : [];

  const taskCountMap = new Map(taskCounts.map((t) => [t.userId, Number(t.count)]));

  res.json(members.map((m) => ({
    userId: m.id,
    name: m.name,
    points: m.points,
    streak: m.streak,
    tasksCompleted: taskCountMap.get(m.id) ?? 0,
    isCurrentUser: m.id === userId,
  })));
});

router.get("/leaderboard/stream", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const [currentUser] = await db.select({ stream: usersTable.stream }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!currentUser?.stream) {
    res.json({ stream: null, entries: [], currentUserRank: null });
    return;
  }

  const members = await db
    .select({ id: usersTable.id, name: usersTable.name, points: usersTable.points, streak: usersTable.streak })
    .from(usersTable)
    .where(eq(usersTable.stream, currentUser.stream))
    .orderBy(desc(usersTable.points))
    .limit(50);

  const memberIds = members.map((m) => m.id);
  const taskCounts = memberIds.length > 0
    ? await db
        .select({ userId: userTasksTable.userId, count: sql<number>`count(*)` })
        .from(userTasksTable)
        .where(sql`${userTasksTable.userId} = ANY(${memberIds})`)
        .groupBy(userTasksTable.userId)
    : [];

  const taskCountMap = new Map(taskCounts.map((t) => [t.userId, Number(t.count)]));

  const entries = members.map((m, index) => ({
    rank: index + 1,
    userId: m.id,
    name: m.name,
    points: m.points,
    streak: m.streak,
    tasksCompleted: taskCountMap.get(m.id) ?? 0,
    isCurrentUser: m.id === userId,
  }));

  const myEntry = entries.find((e) => e.isCurrentUser);

  res.json({
    stream: currentUser.stream,
    entries,
    currentUserRank: myEntry?.rank ?? null,
  });
});

export default router;
