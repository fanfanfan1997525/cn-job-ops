import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ProviderStatus, UserProfile } from "./types.js";
import { redactText } from "./profile.js";

export interface AuditEvent {
  providerId: string;
  operation: string;
  query?: string;
  status: ProviderStatus | "policy_allowed" | "policy_blocked";
  failureReason?: string;
  timestamp?: string;
}

export class AuditLog {
  constructor(
    private readonly path: string,
    private readonly profile?: UserProfile
  ) {
    mkdirSync(dirname(path), { recursive: true });
    if (!existsSync(path)) writeFileSync(path, "", "utf8");
  }

  write(event: AuditEvent) {
    const sanitized = {
      ...event,
      query: event.query ? redactText(event.query, this.profile) : undefined,
      failureReason: event.failureReason ? redactText(event.failureReason, this.profile) : undefined,
      timestamp: event.timestamp ?? new Date().toISOString()
    };
    appendFileSync(this.path, `${JSON.stringify(sanitized)}\n`, "utf8");
  }

  readAll(): AuditEvent[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AuditEvent);
  }
}
