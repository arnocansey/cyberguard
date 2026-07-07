import crypto from "crypto";

export const attachRequestContext = (req, res, next) => {
  const headerId = req.headers["x-request-id"];
  req.requestId = typeof headerId === "string" && headerId.trim() ? headerId : crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
