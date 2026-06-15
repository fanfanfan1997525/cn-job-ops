import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { UserProfile } from "../../../src/types.js";

export function tempWorkspace(prefix = "cn-job-ops-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true })
  };
}

export const completeProfile: UserProfile = {
  version: "test-profile-v1",
  updatedAt: "2026-06-15T00:00:00.000Z",
  basics: {
    name: "Alice Zhang",
    currentTitle: "AI Platform Product Manager",
    yearsExperience: 7,
    city: "上海",
    email: "alice@example.test",
    phone: "13800138000"
  },
  targets: {
    roles: ["AI Platform Product Manager", "增长产品经理", "数据产品经理"],
    cities: ["上海", "杭州", "北京"],
    salaryMinK: 30,
    salaryMaxK: 55,
    industries: ["AI", "SaaS", "B端"]
  },
  cvFacts: [
    "Led AI platform roadmap for enterprise customers",
    "Built data-driven growth dashboards",
    "Coordinated product, engineering, and customer success delivery"
  ],
  redLines: ["培训贷", "押金", "自动投递", "外包合同未披露"],
  platformPreferences: {
    enabledProviders: ["manual", "fixture"],
    forbiddenActions: ["apply", "chat", "automated_login", "captcha_bypass", "proxy_evasion"],
    allowThirdPartyMcpJobs: false,
    aiPromptMode: "redacted"
  }
};

export function loadCases(): Array<any> {
  const path = new URL("./data/synth/cases.json", import.meta.url);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
}
