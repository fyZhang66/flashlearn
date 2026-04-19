import express from 'express';
import cardsManager from '../cards-manager.js';
import requireAuth from '../middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post("/", (req, res) => {
  const { front, explain, expireDays } = req.body;
  
  if (!front?.trim()) {
    res.status(400).json({ error: "required-front" });
    return;
  }

  if (!explain?.trim()) {
    res.status(400).json({ error: "required-explain" });
    return;
  }

  const card = cardsManager.addCard(req.username, front, explain, expireDays || 7);
  res.json(card);
});

router.put("/:cardId", (req, res) => {
  const cardId = req.params.cardId;
  const { front, explain } = req.body;
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

  const updatedCard = cardsManager.updateCard(req.username, cardId, updates);
  if (!updatedCard) {
    res.status(404).json({ error: "card-not-found" });
    return;
  }

  res.json(updatedCard);
});

router.delete("/:cardId", (req, res) => {
  const cardId = req.params.cardId;

  const deleted = cardsManager.deleteCard(req.username, cardId);
  if (!deleted) {
    res.status(404).json({ error: "card-not-found" });
    return;
  }

  res.json({ success: true });
});

router.post("/:cardId/review", (req, res) => {
  const cardId = req.params.cardId;
  if (!cardId) {
    res.status(400).json({ error: "invalid-card-id" });
    return;
  }

  const { reviewOption } = req.body;
  
  const validOptions = ["hard", "good", "easy"];
  if (reviewOption && !validOptions.includes(reviewOption)) {
    res.status(400).json({ error: "invalid-review-option" });
    return;
  }
  
  const updatedCard = cardsManager.reviewCard(req.username, cardId, reviewOption || 'easy');
  
  if (!updatedCard) {
    res.status(404).json({ error: "card-not-found" });
    return;
  }

  const stats = cardsManager.getCardStats(req.username);

  res.json({
    updatedCard,
    stats,
  });
});

export default router;