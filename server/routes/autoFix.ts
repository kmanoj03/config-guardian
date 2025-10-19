import { Router } from "express";
import { autofixTask } from "../handlers/autofixHandler.js";

export const autofixRouter = Router();

// POST /api/autofix/:id  -> generate minimal patch, return unified diff
autofixRouter.post("/:id", async (req, res) => {
  const out = await autofixTask(req.params.id);
  if ("status" in out && out.status !== 200)
    return res.status(out.status).json(out);
  res.json(out);
});
