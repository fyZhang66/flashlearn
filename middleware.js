import sessions from "./sessions.js";

const requireAuth = (req, res, next) => {
  const sid = req.cookies.sid;
  const username = sid ? sessions.getSessionUser(sid) : "";

  if (!sid || !username) {
    res.status(401).send("auth-missing");
    return;
  }

  req.username = username;
  req.sid = sid;

  next();
};

export default requireAuth;