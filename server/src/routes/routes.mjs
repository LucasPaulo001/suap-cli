import express from "express";
const router = express.Router();

import scrappingRouter from "./scrappingRoute.mjs";

router.use("/user", scrappingRouter);


export default router;