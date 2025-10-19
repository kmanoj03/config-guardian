import { Router } from "express";
import { Storage } from "../handlers/storage.js";
import {
  buildEnvelope,
  canonicalStringify,
  sha256Hex,
} from "../utils/provenance.js";

export const provenanceRouter = Router();

/** Verify an envelope by recomputing the hash over its payload */
provenanceRouter.post("/verify", (req, res) => {
  const env = req.body?.envelope;
  if (!env?.payload || !env?.hash) {
    return res.status(400).json({ error: "invalid_envelope" });
  }
  const canonical = canonicalStringify(env.payload);
  const hash = sha256Hex(canonical);
  const ok = hash === env.hash;
  return res.json({ ok, recomputed: hash, provided: env.hash });
});

/** Build stable envelope + hash for a task */
provenanceRouter.post("/:id", (req, res) => {
  const task = Storage.get(req.params.id);
  if (!task) return res.status(404).json({ error: "not found" });

  const { envelope } = buildEnvelope(task);
  return res.json({ envelope });
});
