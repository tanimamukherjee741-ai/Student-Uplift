import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import usersRouter from "./users";
import leaderboardRouter from "./leaderboard";
import notificationsRouter from "./notifications";
import challengesRouter from "./challenges";
import dashboardRouter from "./dashboard";
import tutorsRouter from "./tutors";
import internshipsRouter from "./internships";
import streamsRouter from "./streams";
import studyRouter from "./study";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(usersRouter);
router.use(leaderboardRouter);
router.use(notificationsRouter);
router.use(challengesRouter);
router.use(dashboardRouter);
router.use(tutorsRouter);
router.use(internshipsRouter);
router.use(streamsRouter);
router.use(studyRouter);

export default router;
