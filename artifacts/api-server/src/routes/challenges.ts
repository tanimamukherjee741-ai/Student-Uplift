import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  challengesTable,
  userChallengesTable,
  usersTable,
  notificationsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

function getTodayString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

router.get("/challenges/today", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const today = getTodayString();

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.date, today))
    .limit(1);

  if (!challenge) {
    res.status(404).json({ error: "No challenge available for today" });
    return;
  }

  const [userCompletion] = await db
    .select()
    .from(userChallengesTable)
    .where(
      and(
        eq(userChallengesTable.userId, userId),
        eq(userChallengesTable.challengeId, challenge.id)
      )
    )
    .limit(1);

  res.json({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    reward: challenge.reward,
    bonusReward: challenge.bonusReward,
    points: challenge.points,
    bonusPoints: challenge.bonusPoints,
    completed: !!userCompletion,
    date: challenge.date,
  });
});

router.post("/challenges/:id/complete", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const challengeId = parseInt(req.params.id);

  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId))
    .limit(1);

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const alreadyCompleted = await db
    .select()
    .from(userChallengesTable)
    .where(
      and(
        eq(userChallengesTable.userId, userId),
        eq(userChallengesTable.challengeId, challengeId)
      )
    )
    .limit(1);

  if (alreadyCompleted.length > 0) {
    res.status(400).json({ error: "Challenge already completed" });
    return;
  }

  const totalPoints = challenge.points + challenge.bonusPoints;
  const totalReward = challenge.reward + challenge.bonusReward;

  await db
    .insert(userChallengesTable)
    .values({ userId, challengeId });

  const [updatedUser] = await db
    .update(usersTable)
    .set({
      points: sql`${usersTable.points} + ${totalPoints}`,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  await db.insert(notificationsTable).values({
    userId,
    type: "reward_earned",
    title: "Daily Challenge Completed!",
    message: `Bonus reward! You earned ₹${totalReward} and ${totalPoints} points for completing today's challenge!`,
    read: false,
  });

  res.json({
    task: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: "challenge",
      reward: totalReward,
      points: totalPoints,
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: challenge.createdAt,
    },
    pointsEarned: totalPoints,
    rewardEarned: totalReward,
    newTotalPoints: updatedUser.points,
    message: `Excellent! You earned ₹${totalReward} and ${totalPoints} points (including bonus)!`,
  });
});

export default router;
