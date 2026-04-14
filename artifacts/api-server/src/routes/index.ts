import { Router, type IRouter } from "express";
import healthRouter from "./health";
import requestsRouter from "./requests";
import sessionsRouter from "./sessions";
import outcomesRouter from "./outcomes";
import jiraRouter from "./jira";
import leanixRouter from "./leanix";
import kpisRouter from "./kpis";
import seedRouter from "./seed";
import knowledgeBaseRouter from "./knowledge-base";
import impactAssessmentRouter from "./impact-assessment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requestsRouter);
router.use(sessionsRouter);
router.use(outcomesRouter);
router.use(jiraRouter);
router.use(leanixRouter);
router.use(kpisRouter);
router.use(seedRouter);
router.use(knowledgeBaseRouter);
router.use(impactAssessmentRouter);

export default router;
