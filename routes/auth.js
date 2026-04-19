import express from 'express';
import sessions from '../sessions.js';
import cardsManager from '../cards-manager.js';

const router = express.Router();

router.get("/", (req, res) => {
  const sid = req.cookies.sid;
  const username = sid ? sessions.getSessionUser(sid) : "";
  if (!sid || !username) {
    res.status(401).json({ error: "auth-missing" });
    return;
  }
  res.json({ username });
});

router.post("/", (req, res) => {
  const { username } = req.body;

  if (!cardsManager.isValidUsername(username)) {
    res.status(400).json({ error: "required-username" });
    return;
  }

  if (username === "dog") {
    res.status(403).json({ error: "auth-insufficient" });
    return;
  }

  if (!cardsManager.isUserRegistered(username)) {
    res.status(401).json({ error: "user-not-registered" });
    return;
  }

  const sid = sessions.addSession(username);
  res.cookie("sid", sid);
  res.json({ username });
});

router.delete("/", (req, res) => {
  const sid = req.cookies.sid;
  const username = sid ? sessions.getSessionUser(sid) : "";

  if (sid) {
    res.clearCookie("sid");
  }

  if (username) {
    sessions.deleteSession(sid);
  }

  res.json({ wasLoggedIn: !!username });
});

export default router;