import express from "express";
import * as cards from "../cards-manager.js";
import requireAuth from "../middleware.js";
import { cardsCreatedTotal, cardsReviewedTotal } from "../metrics.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const { front, explain, expireDays } = req.body || {};
    if (!front?.trim()) {
      res.status(400).json({ error: "required-front" });
      return;
    }
    if (!explain?.trim()) {
      res.status(400).json({ error: "required-explain" });
      return;
    }

    const card = await cards.addCard(
      req.userId,
      front,
      explain,
      expireDays || 7,
    );
    cardsCreatedTotal.inc();
    res.json(card);
  } catch (err) {
    next(err);
  }
});

router.put("/:cardId", async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { front, explain } = req.body || {};
    const updates = {};

    if (front !== undefined) {
      if (!front.trim()) {
        res.status(400).json({ error: "required-front" });
        return;
      }
      updates.front = front;
    }
    if (explain !== undefined) {
      if (!explain.trim()) {
        res.status(400).json({ error: "required-explain" });
        return;
      }
      updates.explain = explain;
    }

    const updated = await cards.updateCard(req.userId, cardId, updates);
    if (!updated) {
      res.status(404).json({ error: "card-not-found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:cardId", async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const ok = await cards.deleteCard(req.userId, cardId);
    if (!ok) {
      res.status(404).json({ error: "card-not-found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:cardId/review", async (req, res, next) => {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      res.status(400).json({ error: "invalid-card-id" });
      return;
    }
    const { reviewOption } = req.body || {};
    const valid = ["hard", "good", "easy"];
    const option = reviewOption || "easy";
    if (!valid.includes(option)) {
      res.status(400).json({ error: "invalid-review-option" });
      return;
    }

    const updated = await cards.reviewCard(req.userId, cardId, option);
    if (!updated) {
      res.status(404).json({ error: "card-not-found" });
      return;
    }
    cardsReviewedTotal.inc({ rating: option });

    const stats = await cards.getCardStats(req.userId);
    res.json({ updatedCard: updated, stats });
  } catch (err) {
    next(err);
  }
});

export default router;
