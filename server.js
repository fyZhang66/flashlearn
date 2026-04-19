import { pathToFileURL } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import logger from "./logger.js";
import { checkDb, closeDb } from "./db.js";
import { register as promRegistry, metricsMiddleware } from "./metrics.js";

import authRoutes from "./routes/auth.js";
import registerRoutes from "./routes/register.js";
import cardsRoutes from "./routes/cards.js";
import cardRoutes from "./routes/card.js";

const PORT = Number(process.env.PORT || 3000);
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    // Skip noisy probe / metrics routes from access logs.
    autoLogging: {
      ignore: (req) =>
        req.url === "/healthz" ||
        req.url === "/readyz" ||
        req.url === "/metrics",
    },
  }),
);

app.use(metricsMiddleware);
app.use(cookieParser());
app.use(express.json());

// ── Probes ──────────────────────────────────────────────────────────────
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await checkDb();
    res.json({ status: "ready" });
  } catch (err) {
    logger.warn({ err }, "readyz failed");
    res.status(503).json({ status: "not-ready", reason: "db-unavailable" });
  }
});

// ── Metrics ─────────────────────────────────────────────────────────────
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", promRegistry.contentType);
  res.send(await promRegistry.metrics());
});

// ── API ─────────────────────────────────────────────────────────────────
app.use("/api/session", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/card", cardRoutes);

// ── Static frontend ─────────────────────────────────────────────────────
app.use(express.static("./dist"));

// ── Error handler ───────────────────────────────────────────────────────
// Must be last. Express 5 forwards async rejections here automatically.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, path: req.path }, "unhandled error");
  if (res.headersSent) return;
  res.status(500).json({ error: "internal-error" });
});

// Start the server unless this module is imported by tests.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "flashlearn server listening");
  });

  // Single drain path on termination:
  //   1. stop accepting new connections + wait for in-flight requests
  //   2. flush telemetry (if loaded via --import ./telemetry.js)
  //   3. close the DB pool
  //   4. exit
  // A watchdog forces exit if any step hangs past SHUTDOWN_TIMEOUT_MS.
  const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 30_000);
  let shuttingDown = false;

  const drainHttp = () =>
    new Promise((resolve) => {
      server.close((err) => {
        if (err) logger.error({ err }, "http server close error");
        else logger.info("http server closed");
        resolve();
      });
    });

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down");

    const watchdog = setTimeout(() => {
      logger.error({ ms: SHUTDOWN_TIMEOUT_MS }, "shutdown watchdog; force-exiting");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    watchdog.unref();

    try {
      await drainHttp();
    } catch (err) {
      logger.error({ err }, "error draining http");
    }

    try {
      await globalThis.__otelSdk?.shutdown();
    } catch (err) {
      logger.warn({ err }, "telemetry shutdown error");
    }

    try {
      await closeDb();
    } catch (err) {
      logger.error({ err }, "error closing db");
    }

    clearTimeout(watchdog);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
