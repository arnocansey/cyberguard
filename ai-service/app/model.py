import numpy as np
import os
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier

try:
  import google.generativeai as genai
except ImportError:
  genai = None

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "threat_model.joblib"
MODEL_VERSION = os.getenv("MODEL_VERSION", "threat-rf-v1")
LABELS = ["BENIGN", "SQL_INJECTION", "XSS", "BRUTE_FORCE", "DDOS", "ANOMALY"]
FEATURE_NAMES = [
  "path_length",
  "url_encoded_char_count",
  "single_quote_count",
  "angle_bracket_count",
  "script_token_count",
  "is_post_method",
  "is_error_status",
  "sql_keyword_count",
  "directory_traversal",
  "auth_endpoint_hit"
]

THREAT_GUIDANCE = {
  "SQL_INJECTION": {
    "summary": "Potential SQL injection payload detected in URL/body patterns.",
    "immediate_actions": [
      "Block source IP at WAF/firewall if repeated attempts occur.",
      "Force parameterized queries for affected endpoint.",
      "Enable strict input validation and reject unsafe characters."
    ],
    "next_24h_actions": [
      "Review DB error logs and slow query logs for suspicious statements.",
      "Rotate credentials for any exposed DB user accounts.",
      "Add WAF signatures for SQLi patterns observed in this event."
    ],
    "false_positive_checks": [
      "Check if endpoint accepts encoded search syntax intentionally.",
      "Validate if payload originated from an internal security scanner."
    ],
    "long_term_hardening": [
      "Adopt centralized ORM query building and prohibit raw SQL in app code.",
      "Add unit tests for SQLi payloads on critical endpoints."
    ]
  },
  "XSS": {
    "summary": "Cross-site scripting indicators found (script tags/JS payload shape).",
    "immediate_actions": [
      "Block payload pattern at WAF and sanitize reflected output.",
      "Enable strict output encoding in templates/components.",
      "Review CSP headers for script-src restrictions."
    ],
    "next_24h_actions": [
      "Trace affected route and confirm no unescaped user-generated output.",
      "Invalidate active sessions if account takeover risk exists.",
      "Add XSS test payloads to QA regression suite."
    ],
    "false_positive_checks": [
      "Check if payload comes from penetration tests or internal QA scripts.",
      "Verify if data is stored but never rendered to users."
    ],
    "long_term_hardening": [
      "Enforce CSP with nonce/hashes and disable inline scripts.",
      "Use a trusted sanitization library for rich text inputs."
    ]
  },
  "BRUTE_FORCE": {
    "summary": "Multiple failed auth-like signals indicate brute-force activity.",
    "immediate_actions": [
      "Rate-limit authentication endpoint and apply temporary IP lockout.",
      "Enable CAPTCHA/challenge after repeated failures.",
      "Alert account owners for suspicious login attempts."
    ],
    "next_24h_actions": [
      "Review failed login distribution by IP/ASN/user-agent.",
      "Force password reset for targeted high-value accounts.",
      "Tune lockout thresholds to reduce abuse while minimizing user friction."
    ],
    "false_positive_checks": [
      "Check if load-test or SSO misconfiguration caused repeated 401 responses.",
      "Confirm if endpoint has known flaky auth backend errors."
    ],
    "long_term_hardening": [
      "Make MFA mandatory for privileged roles.",
      "Adopt anomaly-based login risk scoring."
    ]
  },
  "DDOS": {
    "summary": "Traffic/behavior pattern may indicate distributed denial of service activity.",
    "immediate_actions": [
      "Enable upstream DDoS protection profile and tighten rate limits.",
      "Drop abusive IP ranges at edge firewall/CDN.",
      "Prioritize availability of critical endpoints with traffic shaping."
    ],
    "next_24h_actions": [
      "Review spikes by path, method, and source network segments.",
      "Scale edge/ingress resources and tune autoscaling safeguards.",
      "Coordinate with ISP/CDN provider for threat intelligence feeds."
    ],
    "false_positive_checks": [
      "Validate if spike aligns with legitimate campaign or batch job.",
      "Check synthetic monitoring or health probes volume."
    ],
    "long_term_hardening": [
      "Implement bot management and challenge-based filtering.",
      "Create runbooks for surge events with clear escalation thresholds."
    ]
  },
  "ANOMALY": {
    "summary": "Anomalous behavior detected that does not map cleanly to known signatures.",
    "immediate_actions": [
      "Triage related logs around same IP/path/time window.",
      "Temporarily increase monitoring sensitivity for involved assets.",
      "Create watchlist alert for repeated anomalies from same source."
    ],
    "next_24h_actions": [
      "Correlate with endpoint, IAM, and network telemetry.",
      "Promote to incident if repeated or high-risk context appears.",
      "Capture labeled analyst feedback for model retraining."
    ],
    "false_positive_checks": [
      "Check for new product releases or infra changes causing pattern shift.",
      "Validate parser quality for this log source."
    ],
    "long_term_hardening": [
      "Expand baseline profiling by service and time-of-day.",
      "Continuously retrain with analyst-confirmed true/false positives."
    ]
  },
  "BENIGN": {
    "summary": "No strong malicious indicators detected for this event.",
    "immediate_actions": [
      "Keep event for baseline analytics and trend monitoring.",
      "No containment action required unless correlated alerts escalate."
    ],
    "next_24h_actions": [
      "Include in normal dashboard monitoring.",
      "Review only if related high-severity alerts appear."
    ],
    "false_positive_checks": [
      "Confirm parser captured all expected fields.",
      "Validate no decoding issues masked payload content."
    ],
    "long_term_hardening": [
      "Use benign samples to improve model calibration.",
      "Periodically validate baseline drift."
    ]
  }
}


def featurize(log):
  path = str(log.get("path", ""))
  method = str(log.get("method", ""))
  status = int(log.get("statusCode", 200) or 200)
  
  path_lower = path.lower()
  
  # SQL keyword checks
  sql_keywords = ["select", "union", "insert", "drop", "where", "or 1=1", "and 1=1", "admin'"]
  sql_count = sum(1 for kw in sql_keywords if kw in path_lower)
  
  # Directory traversal checks
  dir_traversal = 1 if (".." in path or "etc/passwd" in path_lower or "win.ini" in path_lower) else 0
  
  # Auth endpoint hit checks
  auth_keywords = ["/login", "/auth", "/register", "/signup", "/session"]
  auth_hit = 1 if any(ak in path_lower for ak in auth_keywords) else 0

  return np.array([
    len(path),
    path.count("%"),
    path.count("'"),
    path.count("<"),
    path_lower.count("script"),
    1 if method.upper() == "POST" else 0,
    1 if status >= 400 else 0,
    sql_count,
    dir_traversal,
    auth_hit
  ], dtype=float)


def load_or_train_model():
  if MODEL_PATH.exists():
    try:
      model = joblib.load(MODEL_PATH)
      if getattr(model, "n_features_in_", 0) == len(FEATURE_NAMES):
        return model
    except Exception:
      pass

  data = [
    # Benign queries (0)
    ([10, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0),
    ([18, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0),
    ([25, 1, 0, 0, 0, 0, 0, 0, 0, 0], 0),
    ([5, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0),
    ([12, 0, 0, 0, 0, 1, 0, 0, 0, 0], 0),
    ([14, 0, 0, 0, 0, 0, 1, 0, 0, 0], 0),
    
    # SQL Injections (1)
    ([45, 3, 2, 0, 0, 1, 1, 2, 0, 0], 1),
    ([60, 5, 1, 0, 0, 0, 0, 3, 0, 0], 1),
    ([35, 1, 2, 0, 0, 0, 1, 1, 0, 0], 1),
    ([40, 2, 3, 0, 0, 1, 0, 2, 0, 0], 1),
    
    # XSS (2)
    ([32, 1, 0, 2, 1, 0, 1, 0, 0, 0], 2),
    ([75, 4, 0, 4, 2, 1, 0, 0, 0, 0], 2),
    ([50, 2, 0, 2, 1, 0, 0, 0, 0, 0], 2),
    
    # Brute Force (3)
    ([15, 0, 0, 0, 0, 1, 1, 0, 0, 1], 3),
    ([18, 0, 0, 0, 0, 1, 1, 0, 0, 1], 3),
    ([14, 0, 0, 0, 0, 1, 1, 0, 0, 1], 3),
    
    # DDoS (4)
    ([8, 0, 0, 0, 0, 0, 1, 0, 0, 0], 4),
    ([6, 0, 0, 0, 0, 0, 1, 0, 0, 0], 4),
    ([9, 0, 0, 0, 0, 0, 1, 0, 0, 0], 4),
    
    # Anomaly / Directory Traversal (5)
    ([42, 0, 0, 0, 0, 0, 1, 0, 1, 0], 5),
    ([55, 2, 0, 0, 0, 0, 1, 0, 1, 0], 5),
    ([38, 0, 0, 0, 0, 0, 1, 0, 1, 0], 5)
  ]
  
  X = np.array([x[0] for x in data])
  y = np.array([x[1] for x in data])
  
  model = RandomForestClassifier(n_estimators=100, random_state=42)
  model.fit(X, y)
  MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
  joblib.dump(model, MODEL_PATH)
  return model


def _build_explanation(model, features):
  importances = getattr(model, "feature_importances_", None)
  if importances is None or len(importances) != len(features):
    importances = np.ones(len(features), dtype=float)

  weighted = np.abs(features) * np.array(importances)
  order = np.argsort(weighted)[::-1][:3]

  top_features = []
  for idx in order:
    top_features.append({
      "feature": FEATURE_NAMES[idx],
      "value": float(features[idx]),
      "importance": float(importances[idx]),
      "score": float(weighted[idx])
    })

  reason = ", ".join([f"{item['feature']}={item['value']}" for item in top_features])
  return {
    "top_features": top_features,
    "reason": reason
  }


def _confidence_band(confidence):
  if confidence >= 0.9:
    return "HIGH"
  if confidence >= 0.7:
    return "MEDIUM"
  return "LOW"


def get_guidance_for_label(label, confidence=0.0):
  base = THREAT_GUIDANCE.get(label, THREAT_GUIDANCE["ANOMALY"])
  return {
    "label": label,
    "confidence_band": _confidence_band(confidence),
    **base
  }


def _infer_intent(message):
  q = (message or "").lower()
  if any(token in q for token in ["sql", "injection", "sqli"]):
    return "threat_treatment", "SQL_INJECTION"
  if "xss" in q or "script" in q:
    return "threat_treatment", "XSS"
  if "ddos" in q or "dos" in q:
    return "threat_treatment", "DDOS"
  if "brute" in q or "password spray" in q:
    return "threat_treatment", "BRUTE_FORCE"
  if "incident" in q or "assign" in q or "triage" in q:
    return "incident_workflow", None
  if "dashboard" in q or "panel" in q or "chart" in q:
    return "dashboard_help", None
  return "general_soc_help", None


def _call_gemini_chat(message, history, context):
  api_key = os.getenv("GEMINI_API_KEY", "")
  if not api_key or not genai:
    return None

  try:
    genai.configure(api_key=api_key)
    
    ctx = context or {}
    counts = ctx.get("counts", {})
    top_threats = ctx.get("topThreats24h", [])
    top_line = ", ".join([f"{item.get('type')} ({item.get('count')})" for item in top_threats]) or "None"

    system_instruction = (
      "You are SOC Copilot, a helpful AI assistant for the CyberGuard security platform.\n"
      "You help analysts investigate threats, run playbook mitigations, and configure their dashboard.\n"
      "Here is the active SOC environment metadata you must keep in mind:\n"
      f"- Total Logs: {counts.get('logs', 0)}\n"
      f"- Active Threats: {counts.get('threats', 0)}\n"
      f"- Open/In-progress Incidents: {counts.get('openIncidents', 0)}\n"
      f"- Unresolved Alerts: {counts.get('newAlerts', 0)}\n"
      f"- Top Threat Types (last 24 hours): {top_line}\n\n"
      "You must respond ONLY with a JSON object. Do not wrap in markdown code blocks. The JSON object must match this schema:\n"
      "{\n"
      "  \"intent\": \"string (one of: 'threat_treatment', 'incident_workflow', 'dashboard_help', 'general_soc_help')\",\n"
      "  \"guidanceLabel\": \"string (one of: 'BENIGN', 'SQL_INJECTION', 'XSS', 'BRUTE_FORCE', 'DDOS', 'ANOMALY', or null)\",\n"
      "  \"reply\": \"markdown formatted response text with actionable containment steps and analysis\",\n"
      "  \"suggestedPrompts\": [\"three short related follow-up questions/actions the user might ask next\"]\n"
      "}"
    )

    model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)

    contents = []
    for h in history:
      content = str(h.get("content", "")).strip()
      if not content:
        continue
      role = "user" if h.get("role") == "user" else "model"
      if not contents and role != "user":
        continue
      contents.append({"role": role, "parts": [{"text": content}]})
      
    contents.append({"role": "user", "parts": [{"text": message}]})

    response = model.generate_content(
      contents,
      generation_config={"response_mime_type": "application/json"}
    )

    text_resp = response.text.strip()
    if text_resp.startswith("```"):
      first_nl = text_resp.find("\n")
      if first_nl != -1:
        text_resp = text_resp[first_nl:].strip()
      if text_resp.endswith("```"):
        text_resp = text_resp[:-3].strip()

    result = json.loads(text_resp)
    return result
  except Exception as e:
    print(f"Gemini call failed, falling back: {e}")
    return None


def build_chat_response(message, history=None, context=None):
  # Clean history and try Gemini
  hist = history or []
  gemini_response = _call_gemini_chat(message, hist, context)
  if gemini_response:
    return gemini_response

  ctx = context or {}
  counts = ctx.get("counts", {})
  top_threats = ctx.get("topThreats24h", [])

  intent, explicit_label = _infer_intent(message)
  label = explicit_label
  if not label and top_threats:
    label = top_threats[0].get("type")

  lines = [
    "SOC Copilot summary:",
    f"- Logs: {counts.get('logs', 0)} | Threats: {counts.get('threats', 0)} | Open incidents: {counts.get('openIncidents', 0)} | New alerts: {counts.get('newAlerts', 0)}"
  ]

  if top_threats:
    top_line = ", ".join([f"{item.get('type')} ({item.get('count')})" for item in top_threats[:3]])
    lines.append(f"- Top threats (24h): {top_line}")

  suggestions = [
    "Show me top threat type and first containment step.",
    "How do I triage alerts quickly?",
    "Give me a short incident runbook for today."
  ]

  if intent == "threat_treatment" and label:
    guidance = get_guidance_for_label(label, 0.8)
    lines.append("")
    lines.append(f"Recommended treatment for {label}:")
    for action in guidance.get("immediate_actions", [])[:3]:
      lines.append(f"- {action}")
    lines.append("False-positive checks:")
    for check in guidance.get("false_positive_checks", [])[:2]:
      lines.append(f"- {check}")
    suggestions = [
      f"Create an incident checklist for {label}.",
      f"What log patterns confirm {label}?",
      "Give me next 24h hardening tasks."
    ]
  elif intent == "incident_workflow":
    lines.append("")
    lines.append("Incident workflow:")
    lines.append("- Acknowledge alert, assign owner, and set status to IN_PROGRESS.")
    lines.append("- Add investigation notes with IOC evidence and impacted assets.")
    lines.append("- Close with resolution summary and generate report.")
    suggestions = [
      "Give me a triage checklist template.",
      "What fields should incident notes include?",
      "How do I prioritize incidents by risk?"
    ]
  elif intent == "dashboard_help":
    lines.append("")
    lines.append("Dashboard optimization:")
    lines.append("- Build panels from saved queries and pin high-severity trend cards first.")
    lines.append("- Add attack trend line + top source bar + open incident metric.")
    lines.append("- Use 24h and 7d views side-by-side for spike detection.")

  lines.append("")
  lines.append("This guidance is advisory. Validate against your runbooks before taking production actions.")

  return {
    "intent": intent,
    "guidanceLabel": label,
    "reply": "\n".join(lines),
    "suggestedPrompts": suggestions
  }


def predict(model, logs):
  predictions = []
  for log in logs:
    feats = featurize(log)
    probs = model.predict_proba(feats.reshape(1, -1))[0]
    idx = int(np.argmax(probs))
    label = LABELS[idx]
    confidence = float(probs[idx])
    explanation = _build_explanation(model, feats)
    guidance = get_guidance_for_label(label, confidence)

    predictions.append({
      "logId": log.get("id"),
      "label": label,
      "confidence": confidence,
      "modelVersion": MODEL_VERSION,
      "explanation": explanation,
      "guidance": guidance
    })
  return predictions
