import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import usersRouter from "./users";
import leaderboardRouter from "./leaderboard";
import notificationsRouter from "./notifications";
import challengesRouter from "./challenges";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(usersRouter);
router.use(leaderboardRouter);
router.use(notificationsRouter);
router.use(challengesRouter);
router.use(dashboardRouter);

export default router;
