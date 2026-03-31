import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studySessionsTable } from "@workspace/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

const DAILY_GOAL_MINUTES = 120;

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

router.post("/study/sessions", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { durationSeconds, date } = req.body;

  if (!durationSeconds || durationSeconds <= 0) {
    res.status(400).json({ error: "durationSeconds must be a positive number" });
    return;
  }

  const sessionDate = date ?? getTodayString();

  await db.insert(studySessionsTable).values({ userId, durationSeconds, sessionDate });

  // Get today's total
  const todayTotal = await db
    .select({ total: sql<number>`COALESCE(sum(${studySessionsTable.durationSeconds}), 0)` })
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.userId, userId), eq(studySessionsTable.sessionDate, sessionDate)));

  const totalSeconds = Number(todayTotal[0]?.total ?? 0);
  const totalMinutesToday = Math.floor(totalSeconds / 60);
  const sessionMinutes = Math.floor(durationSeconds / 60);
  const goalReached = totalMinutesToday >= DAILY_GOAL_MINUTES;

  let message = `Great! You studied for ${sessionMinutes} minute${sessionMinutes !== 1 ? "s" : ""}!`;
  if (goalReached && totalMinutesToday - sessionMinutes < DAILY_GOAL_MINUTES) {
    message = `Amazing! You've reached your daily goal of ${DAILY_GOAL_MINUTES} minutes! Total today: ${totalMinutesToday} minutes.`;
  } else if (sessionMinutes >= 30) {
    message = `Excellent focus! You studied for ${sessionMinutes} minutes. Keep it up!`;
  } else if (sessionMinutes >= 10) {
    message = `Good session! You studied for ${sessionMinutes} minutes.`;
  } else if (sessionMinutes > 0) {
    message = `Nice start! You studied for ${sessionMinutes} minute${sessionMinutes !== 1 ? "s" : ""}.`;
  }

  res.status(201).json({
    sessionMinutes,
    totalMinutesToday,
    goalMinutes: DAILY_GOAL_MINUTES,
    message,
    goalReached,
  });
});

router.get("/study/today", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const today = getTodayString();

  const result = await db
    .select({
      total: sql<number>`COALESCE(sum(${studySessionsTable.durationSeconds}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.userId, userId), eq(studySessionsTable.sessionDate, today)));

  const totalSeconds = Number(result[0]?.total ?? 0);
  const sessionsCount = Number(result[0]?.count ?? 0);
  const totalMinutes = Math.floor(totalSeconds / 60);

  res.json({
    totalSeconds,
    totalMinutes,
    goalMinutes: DAILY_GOAL_MINUTES,
    goalReached: totalMinutes >= DAILY_GOAL_MINUTES,
    sessionsCount,
  });
});

router.get("/study/history", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const history = await db
    .select({
      date: studySessionsTable.sessionDate,
      totalSeconds: sql<number>`sum(${studySessionsTable.durationSeconds})`,
      sessionsCount: sql<number>`count(*)`,
    })
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.userId, userId), gte(studySessionsTable.sessionDate, sevenDaysAgoStr)))
    .groupBy(studySessionsTable.sessionDate)
    .orderBy(studySessionsTable.sessionDate);

  res.json(history.map((h) => ({
    date: h.date,
    totalMinutes: Math.floor(Number(h.totalSeconds) / 60),
    sessionsCount: Number(h.sessionsCount),
  })));
});

export default router;
