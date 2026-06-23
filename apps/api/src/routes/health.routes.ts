import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "KiraPass API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

export default router;
