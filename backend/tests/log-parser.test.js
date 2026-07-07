import { parseLine } from "../src/utils/log-parser.js";

describe("log parser", () => {
  it("parses apache line", () => {
    const parsed = parseLine('127.0.0.1 - - [17/Feb/2026:10:00:00 +0000] "GET /api/test HTTP/1.1" 200 123');
    expect(parsed.source).toBe("apache");
    expect(parsed.ipAddress).toBe("127.0.0.1");
  });

  it("parses firewall line", () => {
    const parsed = parseLine('IN=eth0 OUT= MAC= SRC=10.0.0.5 DST=10.0.0.9 LEN=60 PROTO=TCP SPT=51515 DPT=443');
    expect(parsed.source).toBe("firewall");
    expect(parsed.destinationPort).toBe(443);
  });
});
