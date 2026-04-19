import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import registerRoutes from "./routes/register.js";
import cardsRoutes from "./routes/cards.js";
import cardRoutes from "./routes/card.js";

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.static("./dist"));
app.use(express.json());

app.use("/api/session", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/card", cardRoutes);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
