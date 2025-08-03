import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

import router from "./routes/routes.mjs";
app.use(router);

app.listen(8080, () => {
    console.log("Conectado ao servidor!");
});