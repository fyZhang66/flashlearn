import express from "express";
import * as sessions from "../sessions.js";
import * as users from "../user-management.js";
import { loginAttemptsTotal } from "../metrics.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const user = await sessions.getSessionUser(req.cookies?.sid);
    if (!user) {
      res.status(401).json({ error: "auth-missing" });
      return;
    }
    res.json({ username: user.username });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!users.isValidUsername(username)) {
      loginAttemptsTotal.inc({ outcome: "invalid-username" });
      res.status(400).json({ error: "required-username" });
      return;
    }
    if (!users.isValidPassword(password)) {
      loginAttemptsTotal.inc({ outcome: "invalid-password" });
      res.status(400).json({ error: "required-password" });
      return;
    }

    const user = await users.verifyPassword(username, password);
    if (!user) {
      const registered = await users.isUserRegistered(username);
      loginAttemptsTotal.inc({
        outcome: registered ? "bad-password" : "no-such-user",
      });
      res.status(401).json({
        error: registered ? "bad-password" : "user-not-registered",
      });
      return;
    }

    const sid = await sessions.addSession(user.id);
    res.cookie("sid", sid, { httpOnly: true, sameSite: "lax" });
    loginAttemptsTotal.inc({ outcome: "success" });
    res.json({ username: user.username });
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const sid = req.cookies?.sid;
    const user = await sessions.getSessionUser(sid);
    if (sid) {
      await sessions.deleteSession(sid);
      res.clearCookie("sid");
    }
    res.json({ wasLoggedIn: !!user });
  } catch (err) {
    next(err);
  }
});

export default router;
