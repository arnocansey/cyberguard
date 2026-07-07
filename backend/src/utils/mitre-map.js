export const MITRE_MAP = {
  SQL_INJECTION: {
    tactic: "Initial Access",
    techniqueId: "T1190",
    technique: "Exploit Public-Facing Application"
  },
  XSS: {
    tactic: "Execution",
    techniqueId: "T1059",
    technique: "Command and Scripting Interpreter"
  },
  BRUTE_FORCE: {
    tactic: "Credential Access",
    techniqueId: "T1110",
    technique: "Brute Force"
  },
  DDOS: {
    tactic: "Impact",
    techniqueId: "T1498",
    technique: "Network Denial of Service"
  },
  ANOMALY: {
    tactic: "Discovery",
    techniqueId: "T1087",
    technique: "Account Discovery"
  },
  BENIGN: {
    tactic: "N/A",
    techniqueId: "N/A",
    technique: "No adversarial mapping"
  }
};

export const getMitreForThreat = (threatType) => MITRE_MAP[threatType] || MITRE_MAP.BENIGN;
