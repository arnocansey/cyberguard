import os
from flask import Flask, request, jsonify
from app.model import (
  MODEL_VERSION,
  LABELS,
  build_chat_response,
  get_guidance_for_label,
  load_or_train_model,
  predict
)

app = Flask(__name__)
model = load_or_train_model()
ai_api_key = os.getenv("AI_SERVICE_API_KEY", "")

metrics = {
  "predict_requests_total": 0,
  "chat_requests_total": 0,
  "predictions_total": 0,
  "last_error": None
}


def _is_authorized(req):
  if not ai_api_key:
    return True
  incoming = req.headers.get("x-ai-api-key", "")
  return incoming == ai_api_key


@app.get("/health/live")
def health_live():
  return jsonify({
    "status": "ok",
    "service": "ai-threat-classifier",
    "modelVersion": MODEL_VERSION
  })


@app.get("/health/ready")
def health_ready():
  model_ok = model is not None
  status = 200 if model_ok else 503
  return jsonify({
    "status": "ok" if model_ok else "degraded",
    "service": "ai-threat-classifier",
    "modelVersion": MODEL_VERSION,
    "checks": {"modelLoaded": model_ok}
  }), status


@app.get("/health")
def health():
  return health_ready()


@app.get("/metrics")
def get_metrics():
  return jsonify({
    "service": "ai-threat-classifier",
    "modelVersion": MODEL_VERSION,
    **metrics
  })


@app.get("/guidance/<label>")
def guidance_by_label(label):
  normalized = str(label or "").upper()
  if normalized not in LABELS:
    return jsonify({"message": "Unknown threat label"}), 404
  return jsonify({"modelVersion": MODEL_VERSION, "guidance": get_guidance_for_label(normalized, 0.8)})


@app.post("/predict")
def predict_route():
  if not _is_authorized(request):
    return jsonify({"message": "Unauthorized"}), 401

  payload = request.get_json(silent=True) or {}
  logs = payload.get("logs", [])
  if not isinstance(logs, list):
    return jsonify({"message": "logs must be an array"}), 400

  metrics["predict_requests_total"] += 1

  try:
    predictions = predict(model, logs)
    metrics["predictions_total"] += len(predictions)
    return jsonify({"modelVersion": MODEL_VERSION, "predictions": predictions})
  except Exception as exc:
    metrics["last_error"] = str(exc)
    return jsonify({"message": "Prediction failed"}), 500


@app.post("/chat")
def chat_route():
  if not _is_authorized(request):
    return jsonify({"message": "Unauthorized"}), 401

  payload = request.get_json(silent=True) or {}
  message = payload.get("message", "")
  history = payload.get("history", [])
  context = payload.get("context", {})

  if not isinstance(message, str) or not message.strip():
    return jsonify({"message": "message is required"}), 400

  if len(message) > 1500:
    return jsonify({"message": "message too long"}), 400

  metrics["chat_requests_total"] += 1

  try:
    reply = build_chat_response(message=message, history=history, context=context)
    return jsonify({"modelVersion": MODEL_VERSION, **reply})
  except Exception as exc:
    metrics["last_error"] = str(exc)
    return jsonify({"message": "Chat response failed"}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=8000)
