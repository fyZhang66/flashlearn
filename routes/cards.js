import express from "express";
import * as cards from "../cards-manager.js";
import requireAuth from "../middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const status = req.query?.status || "all";
    const result = await cards.getCardsByStatus(req.userId, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/next", async (req, res, next) => {
  try {
    const due = await cards.getDueCards(req.userId);
    if (due.length === 0) {
      res.json({ done: true });
      return;
    }
    res.json({ card: due[0], remaining: due.length - 1 });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await cards.getCardStats(req.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
