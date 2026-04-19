import express from 'express';
import cardsManager from '../cards-manager.js';

const router = express.Router();

router.post("/", (req, res) => {
  const { username } = req.body;

  if (!cardsManager.isValidUsername(username)) {
    res.status(400).json({ error: "required-username" });
    return;
  }
  
  if (cardsManager.isUserRegistered(username)) {
    res.status(409).json({ error: "username-already-exists" });
    return;
  }
  cardsManager.registerUserWithCards(username);
  
  res.json({ 
    success: true, 
    username,
    message: "Account created successfully. Please log in."
  });
});

export default router;