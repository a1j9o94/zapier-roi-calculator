#!/usr/bin/env node
/**
 * HEAD/GET external URLs referenced in ROI source metadata (ARCHETYPE_FIELDS, methodology).
 * Fails on HTTP 4xx/5xx. Optional allowlist for known bot-walls (403 from datacenter IPs, etc.).
 *
 * Usage: node scripts/check-source-links.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ALLOWLIST_PATH = join(root, "scripts/source-link-check-allowlist.txt");

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const TIMEOUT_MS = 35000;

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const text = readFileSync(ALLOWLIST_PATH, "utf8");
  return new Set(
    text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  );
}

function extractUrlsFromTs(content) {
  const urls = new Set();
  const re = /https?:\/\/[^\s"'`>)\]]+/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    let u = m[0];
    u = u.replace(/[),.;]+$/, "");
    urls.add(u);
  }
  return urls;
}

function collectUrls() {
  const urls = new Set();
  const files = [
    join(root, "src/types/archetypes.ts"),
    join(root, "src/data/methodology.ts"),
    join(root, "src/constants/sources.ts"),
  ];
  for (const f of files) {
    const c = readFileSync(f, "utf8");
    for (const u of extractUrlsFromTs(c)) urls.add(u);
  }
  return [...urls].sort();
}

async function checkUrl(url, allowlist) {
  if (allowlist.has(url)) {
    return { url, status: "allowlisted", code: null };
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: BROWSER_HEADERS,
        signal: controller.signal,
      });
    }
    const code = res.status;
    if (code >= 400) {
      return { url, status: "fail", code };
    }
    return { url, status: "ok", code };
  } catch (e) {
    return { url, status: "error", code: e?.cause?.code ?? e?.message ?? String(e) };
  } finally {
    clearTimeout(t);
  }
}

const allowlist = loadAllowlist();
const urls = collectUrls();
const failures = [];

for (const url of urls) {
  const r = await checkUrl(url, allowlist);
  if (r.status === "ok" || r.status === "allowlisted") {
    console.log(`${r.status === "allowlisted" ? "SKIP" : "OK  "} ${url}${r.code != null ? ` (${r.code})` : ""}`);
  } else {
    console.error(`FAIL ${url} — ${r.status} ${r.code}`);
    failures.push(r);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} URL(s) failed. Fix links or document in ${ALLOWLIST_PATH}`);
  process.exit(1);
}

console.log(`\nAll ${urls.length} source URL(s) passed.`);
