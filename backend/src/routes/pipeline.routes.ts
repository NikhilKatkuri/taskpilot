import { Router } from "express";
import { feed, pipeline } from "../pipeline/main";

const pipeLineRouter: Router = Router();


pipeLineRouter.post("/project/pipeline/feed", feed);
pipeLineRouter.post("/project/pipeline/run/:userId/:chatId", pipeline);

export default pipeLineRouter;
