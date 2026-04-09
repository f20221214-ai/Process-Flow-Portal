import { Router, type IRouter } from "express";
import healthRouter from "./health";
import requestsRouter from "./requests";
import sessionsRouter from "./sessions";
import outcomesRouter from "./outcomes";
import jiraRouter from "./jira";
import kpisRouter from "./kpis";
import seedRouter from "./seed";
import knowledgeBaseRouter from "./knowledge-base";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requestsRouter);
router.use(sessionsRouter);
router.use(outcomesRouter);
router.use(jiraRouter);
router.use(kpisRouter);
router.use(seedRouter);
router.use(knowledgeBaseRouter);

export default router;
