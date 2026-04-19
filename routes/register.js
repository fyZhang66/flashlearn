import express from "express";
import * as users from "../user-management.js";
import { userRegistrationsTotal } from "../metrics.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!users.isValidUsername(username)) {
      res.status(400).json({ error: "required-username" });
      return;
    }
    if (!users.isValidPassword(password)) {
      res.status(400).json({ error: "required-password" });
      return;
    }

    const created = await users.registerUser(username, password);
    if (!created) {
      res.status(409).json({ error: "username-already-exists" });
      return;
    }

    userRegistrationsTotal.inc();
    res.json({
      success: true,
      username: created.username,
      message: "Account created successfully. Please log in.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
