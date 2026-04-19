import client from "prom-client";

export const register = new client.Registry();
register.setDefaultLabels({
  service: process.env.OTEL_SERVICE_NAME || "flashlearn",
});
client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const inprogressRequests = new client.Gauge({
  name: "inprogress_requests",
  help: "In-flight HTTP requests",
  registers: [register],
});

export const cardsReviewedTotal = new client.Counter({
  name: "cards_reviewed_total",
  help: "Cards reviewed, labeled by rating",
  labelNames: ["rating"],
  registers: [register],
});

export const cardsCreatedTotal = new client.Counter({
  name: "cards_created_total",
  help: "Cards created",
  registers: [register],
});

export const userRegistrationsTotal = new client.Counter({
  name: "user_registrations_total",
  help: "User registrations",
  registers: [register],
});

export const loginAttemptsTotal = new client.Counter({
  name: "login_attempts_total",
  help: "Login attempts labeled by outcome",
  labelNames: ["outcome"],
  registers: [register],
});

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  inprogressRequests.inc();

  res.on("finish", () => {
    const durSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path
      ? (req.baseUrl || "") + req.route.path
      : req.path;
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durSec);
    inprogressRequests.dec();
  });

  next();
}
