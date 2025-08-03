import express from "express";
const scrappingRouter = express.Router();

import { getData } from "../controllers/scrappingController.mjs";

scrappingRouter.post("/boletim", getData);

export default scrappingRouter;