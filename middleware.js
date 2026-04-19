import { getSessionUser } from "./sessions.js";

export default async function requireAuth(req, res, next) {
  try {
    const sid = req.cookies?.sid;
    const user = await getSessionUser(sid);
    if (!user) {
      res.status(401).json({ error: "auth-missing" });
      return;
    }
    req.user = user;
    req.username = user.username;
    req.userId = user.id;
    req.sid = sid;
    next();
  } catch (err) {
    next(err);
  }
}
