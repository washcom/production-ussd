import express from "express";
import { webhook } from "./controllers/UssdController";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/ussd", webhook);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`USSD gateway listening on port ${PORT}`);
});
