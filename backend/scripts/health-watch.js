import axios from "axios";

const intervalMs = Number(process.env.HEALTH_POLL_MS || 60000);
const backendUrl = process.env.BACKEND_HEALTH_URL || "http://localhost:5000/health/ready";
const metricsUrl = process.env.BACKEND_METRICS_URL || "http://localhost:5000/metrics";
const aiTimeoutThreshold = Number(process.env.AI_TIMEOUT_ALERT_THRESHOLD || 10);

const check = async () => {
  const [health, metrics] = await Promise.all([
    axios.get(backendUrl, { timeout: 5000 }),
    axios.get(metricsUrl, { timeout: 5000 })
  ]);

  const degraded = health.status >= 500 || health.data?.status !== "ok";
  const aiTimeoutTotal = metrics.data?.metrics?.ai?.timeoutTotal || 0;
  const timeoutSpike = aiTimeoutTotal >= aiTimeoutThreshold;

  if (degraded || timeoutSpike) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Health monitor alert",
        degraded,
        timeoutSpike,
        aiTimeoutTotal,
        aiTimeoutThreshold,
        at: new Date().toISOString()
      })
    );
    process.exitCode = 2;
    return;
  }

  console.log(
    JSON.stringify({
      level: "info",
      message: "Health monitor OK",
      aiTimeoutTotal,
      at: new Date().toISOString()
    })
  );
};

const run = async () => {
  try {
    await check();
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Health monitor request failed",
        error: error.message,
        at: new Date().toISOString()
      })
    );
    process.exitCode = 2;
  }
};

if (process.env.HEALTH_WATCH_ONCE === "true") {
  run();
} else {
  run();
  setInterval(run, intervalMs);
}
