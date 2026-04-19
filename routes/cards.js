import express from 'express';
import cardsManager from '../cards-manager.js';
import requireAuth from '../middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const { status } = req.query || "all";
  let cards = cardsManager.getCardsByStatus(req.username, status);
  res.json(cards);
});

router.get("/next", (req, res) => {
  const dueCards = cardsManager.getDueCards(req.username);
  
  if (dueCards.length === 0) {
    res.json({ done: true });
    return;
  }
  
  res.json({ card: dueCards[0], remaining: dueCards.length - 1 });
});

router.get("/stats", (req, res) => {
  const stats = cardsManager.getCardStats(req.username);
  res.json(stats);
});

export default router;