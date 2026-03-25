import { Router, type IRouter } from "express";
import healthRouter from "./health";
import requestsRouter from "./requests";
import sessionsRouter from "./sessions";
import outcomesRouter from "./outcomes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requestsRouter);
router.use(sessionsRouter);
router.use(outcomesRouter);

export default router;
