import { Router, type IRouter } from "express";
import healthRouter from "./health";
import requestsRouter from "./requests";
import sessionsRouter from "./sessions";
import outcomesRouter from "./outcomes";
import jiraRouter from "./jira";
import kpisRouter from "./kpis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requestsRouter);
router.use(sessionsRouter);
router.use(outcomesRouter);
router.use(jiraRouter);
router.use(kpisRouter);

export default router;
