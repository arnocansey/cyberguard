const apacheRegex =
  /^(\S+)\s\S+\s\S+\s\[([^\]]+)]\s"([A-Z]+)\s([^"\s]+)(?:\sHTTP\/\d\.\d)?"\s(\d{3})\s(\d+|-)/;

const nginxRegex =
  /^(\S+)\s-\s\S+\s\[([^\]]+)]\s"([A-Z]+)\s([^"\s]+)(?:\sHTTP\/\d\.\d)?"\s(\d{3})\s(\d+|-)/;

const firewallRegex =
  /SRC=(\S+).*DST=(\S+).*PROTO=(\S+).*SPT=(\d+).*DPT=(\d+)/;

export const parseLine = (line) => {
  const apache = line.match(apacheRegex);
  if (apache) {
    return {
      ipAddress: apache[1],
      timestamp: apache[2],
      method: apache[3],
      path: apache[4],
      statusCode: Number(apache[5]),
      bytes: apache[6] === "-" ? 0 : Number(apache[6]),
      source: "apache"
    };
  }

  const nginx = line.match(nginxRegex);
  if (nginx) {
    return {
      ipAddress: nginx[1],
      timestamp: nginx[2],
      method: nginx[3],
      path: nginx[4],
      statusCode: Number(nginx[5]),
      bytes: nginx[6] === "-" ? 0 : Number(nginx[6]),
      source: "nginx"
    };
  }

  const firewall = line.match(firewallRegex);
  if (firewall) {
    return {
      source: "firewall",
      ipAddress: firewall[1],
      destinationIp: firewall[2],
      protocol: firewall[3],
      sourcePort: Number(firewall[4]),
      destinationPort: Number(firewall[5]),
      message: line
    };
  }

  return { source: "unknown", message: line };
};
