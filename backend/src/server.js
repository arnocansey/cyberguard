import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startScheduler } from "./services/scheduler.service.js";
import { chatAssist } from "./services/chat.service.js";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.frontendOrigin, credentials: true }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const streamReply = async (socket, requestId, text) => {
  const reply = String(text || "");
  const chunkSize = 28;

  for (let i = 0; i < reply.length; i += chunkSize) {
    socket.emit("chat:chunk", { requestId, delta: reply.slice(i, i + chunkSize) });
    await sleep(14);
  }
};

io.use((socket, next) => {
  try {
    const authToken = socket.handshake?.auth?.token;
    const headerAuth = socket.handshake?.headers?.authorization || "";
    const bearerToken = headerAuth.startsWith("Bearer ") ? headerAuth.slice(7) : "";
    const token = authToken || bearerToken;

    if (!token) {
      socket.data.user = null;
      return next();
    }

    socket.data.user = jwt.verify(token, env.jwtAccessSecret);
    return next();
  } catch {
    socket.data.user = null;
    return next();
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Socket connected" });

  socket.on("chat:ask", async (payload = {}) => {
    const requestId = String(payload.requestId || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);

    if (!socket.data?.user?.sub) {
      socket.emit("chat:error", { requestId, message: "Unauthorized socket session. Please log in again." });
      return;
    }

    const message = String(payload.message || "").trim();
    const history = Array.isArray(payload.history) ? payload.history : [];
    const tenantId = String(payload.tenantId || "default");

    if (message.length < 2 || message.length > 1500) {
      socket.emit("chat:error", { requestId, message: "Message must be between 2 and 1500 characters." });
      return;
    }

    socket.emit("chat:start", { requestId });

    try {
      const data = await chatAssist({ userId: socket.data.user.sub, message, history, tenantId });
      await streamReply(socket, requestId, data.reply || "");

      socket.emit("chat:done", {
        requestId,
        data: {
          modelVersion: data.modelVersion,
          intent: data.intent,
          guidanceLabel: data.guidanceLabel,
          suggestedPrompts: data.suggestedPrompts || [],
          degraded: Boolean(data.degraded)
        }
      });
    } catch (error) {
      logger.error({ err: error, requestId }, "Chat socket handling failed");
      socket.emit("chat:error", { requestId, message: "Failed to stream chat response." });
    }
  });
});

if (env.nodeEnv !== "test") startScheduler(io);

server.listen(env.port, () => {
  logger.info({ port: env.port }, "Backend running");
});
