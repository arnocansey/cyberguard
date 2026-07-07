const state = {
  startedAt: Date.now(),
  requestsTotal: 0,
  errorsTotal: 0,
  byStatus: {},
  byMethod: {},
  byRoute: {},
  latencyMs: {
    count: 0,
    sum: 0,
    max: 0
  },
  aiTimeoutTotal: 0,
  aiRetryTotal: 0
};

const inc = (bucket, key, amount = 1) => {
  bucket[key] = (bucket[key] || 0) + amount;
};

export const recordRequest = ({ method, route, statusCode, durationMs }) => {
  state.requestsTotal += 1;
  inc(state.byMethod, method || "UNKNOWN");
  inc(state.byStatus, String(statusCode || 0));
  inc(state.byRoute, route || "unknown");

  const d = Number(durationMs || 0);
  state.latencyMs.count += 1;
  state.latencyMs.sum += d;
  state.latencyMs.max = Math.max(state.latencyMs.max, d);
};

export const recordError = () => {
  state.errorsTotal += 1;
};

export const recordAiTimeout = () => {
  state.aiTimeoutTotal += 1;
};

export const recordAiRetry = () => {
  state.aiRetryTotal += 1;
};

export const getMetricsSnapshot = () => {
  const uptimeSec = Math.max(0, (Date.now() - state.startedAt) / 1000);
  const avgLatency = state.latencyMs.count ? state.latencyMs.sum / state.latencyMs.count : 0;

  return {
    uptimeSec: Number(uptimeSec.toFixed(2)),
    requestsTotal: state.requestsTotal,
    errorsTotal: state.errorsTotal,
    errorRate: state.requestsTotal ? Number((state.errorsTotal / state.requestsTotal).toFixed(4)) : 0,
    byStatus: state.byStatus,
    byMethod: state.byMethod,
    byRoute: state.byRoute,
    latencyMs: {
      avg: Number(avgLatency.toFixed(2)),
      max: Number(state.latencyMs.max.toFixed(2)),
      count: state.latencyMs.count
    },
    ai: {
      timeoutTotal: state.aiTimeoutTotal,
      retryTotal: state.aiRetryTotal
    }
  };
};
