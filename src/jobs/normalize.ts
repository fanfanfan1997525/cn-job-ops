import { createHash } from "node:crypto";
import type { CanonicalJob, RawJobInput, SalaryInfo } from "../types.js";

export function normalizeJob(input: RawJobInput): CanonicalJob {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const providerId = input.providerId ?? input.platform ?? "manual";
  const platform = input.platform ?? providerId;
  const cities = parseCities(input.city ?? "");
  const salary = parseSalary(input.salary ?? "");
  const tags = Array.from(new Set((input.tags ?? []).map((tag) => normalizeVisible(tag)).filter(Boolean))).sort();
  const rawTitle = input.title.trim();
  const rawCompany = input.company.trim();
  const title = normalizeVisible(rawTitle);
  const company = normalizeVisible(rawCompany);
  const city = cities.join("/");
  const canonicalUrl = canonicalizeUrl(input.url ?? null);
  const contentHash = hashObject({
    title,
    company,
    cities,
    salary,
    experience: normalizeVisible(input.experience ?? ""),
    education: normalizeVisible(input.education ?? ""),
    tags,
    description: normalizeVisible(input.description)
  });
  const identityFingerprint = hashObject({
    title: comparable(title),
    company: comparable(company),
    cities: [...cities].sort().map(comparable),
    discriminator: comparable(input.description).slice(0, 80)
  }).slice(0, 24);
  return {
    source: {
      providerId,
      platform,
      url: input.url ?? null,
      canonicalUrl,
      rawRef: input.rawRef ?? null,
      fetchedAt
    },
    title,
    rawTitle,
    company,
    rawCompany,
    city,
    cities,
    salary,
    experience: normalizeVisible(input.experience ?? ""),
    education: normalizeVisible(input.education ?? ""),
    tags,
    description: normalizeVisible(input.description),
    contentHash,
    identityFingerprint,
    dedupKey: canonicalUrl ? `url:${canonicalUrl}` : `fp:${identityFingerprint}`
  };
}

export function stableJobFingerprint(job: CanonicalJob) {
  return job.identityFingerprint;
}

export function parseSalary(raw: string): SalaryInfo {
  const normalized = raw.trim();
  const isNegotiable = /面议|negotiable/i.test(normalized) || normalized.length === 0;
  const monthsMatch = normalized.match(/[·xX*]?\s*(1[0-9])\s*薪/);
  const monthsPerYear = monthsMatch ? Number(monthsMatch[1]) : null;
  const equityFlag = /股权|期权|equity/i.test(normalized);
  if (isNegotiable) {
    return { raw: normalized, minK: null, maxK: null, currency: "CNY", period: "month", monthsPerYear, isNegotiable: true, equityFlag };
  }
  const range = normalized.match(/(\d+(?:\.\d+)?)\s*[-~到]\s*(\d+(?:\.\d+)?)\s*[kK]/);
  if (range) {
    return { raw: normalized, minK: Number(range[1]), maxK: Number(range[2]), currency: "CNY", period: "month", monthsPerYear, isNegotiable: false, equityFlag };
  }
  const above = normalized.match(/(\d+(?:\.\d+)?)\s*[kK]\s*(?:以上|\+)/);
  if (above) {
    return { raw: normalized, minK: Number(above[1]), maxK: null, currency: "CNY", period: "month", monthsPerYear, isNegotiable: false, equityFlag };
  }
  const single = normalized.match(/(\d+(?:\.\d+)?)\s*[kK]/);
  if (single) {
    return { raw: normalized, minK: Number(single[1]), maxK: Number(single[1]), currency: "CNY", period: "month", monthsPerYear, isNegotiable: false, equityFlag };
  }
  return { raw: normalized, minK: null, maxK: null, currency: "CNY", period: "month", monthsPerYear, isNegotiable: false, equityFlag };
}

export function parseCities(raw: string) {
  const parts = raw
    .replace(/全国|远程/g, (match) => `/${match}/`)
    .split(/[\/,，、;；\s]+/)
    .map((city) => normalizeVisible(city).replace(/市$/, ""))
    .filter(Boolean);
  return Array.from(new Set(parts.length ? parts : ["未指定"])).sort();
}

export function canonicalizeUrl(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return raw.trim().split(/[?#]/)[0] || null;
  }
}

function hashObject(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeVisible(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function comparable(value: string) {
  return normalizeVisible(value)
    .toLowerCase()
    .replace(/[|｜,，、;；/\\\s]/g, "");
}
