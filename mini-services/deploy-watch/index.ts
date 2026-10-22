// Railway deploy watcher — WEEKLY//UNI
// Retries `railway up -d` until the platform pause lifts, then:
//   1. waits for health OK
//   2. waits until the NEW build is live (chunk-hash change vs baseline)
//   3. POSTs the preview exam (only after new build confirmed — old POST route drops notes)
// Log: /tmp/railway-deploy-v2.log

const LOG = "/tmp/railway-deploy-v2.log";
const BASE = "https://weeklyuni.up.railway.app";
const RAILWAY = `${process.env.HOME}/.railway/bin/railway`;
const { execSync } = await import("node:child_process");

function logLine(line: string) {
  try {
    execSync(`cat >> ${LOG} << 'EOFL'\n${line}\nEOFL`);
  } catch {}
  console.log(line);
}

async function getChunksHash(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"]*\.js/g)].map((m) => m[0]);
    const unique = [...new Set(chunks)].sort();
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(unique.join("\n")));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

async function main() {
  execSync(`: > ${LOG}`);
  logLine(`watcher v3 (mini-service) started ${new Date().toISOString()}`);

  const oldHash = await getChunksHash();
  logLine(`baseline chunk hash: ${oldHash}`);

  for (let i = 1; i <= 45; i++) {
    logLine(`=== attempt ${i} ${new Date().toISOString()} ===`);
    let upOk = false;
    try {
      const out = execSync(`${RAILWAY} up -d 2>&1`, { cwd: "/home/z/my-project", timeout: 240_000 });
      logLine(String(out));
      upOk = true;
    } catch (e: unknown) {
      const err = e as { stdout?: Buffer | string; message?: string };
      const text = err.stdout ? String(err.stdout) : (err.message ?? "unknown");
      logLine(text.trim());
      upOk = false;
    }
    if (!upOk) {
      await new Promise((r) => setTimeout(r, 240_000));
      continue;
    }

    logLine(`RAILWAY_UP_ACCEPTED ${new Date().toISOString()}`);
    await new Promise((r) => setTimeout(r, 90_000));

    let healthOk = false;
    for (let j = 1; j <= 60; j++) {
      try {
        const res = await fetch(`${BASE}/api/health`);
        const body = await res.text();
        logLine(`health ${j}: ${body}`);
        if (body.includes('"ok":true')) {
          healthOk = true;
          break;
        }
      } catch (e) {
        logLine(`health ${j}: error ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 20_000));
    }
    logLine(`HEALTH_OK=${healthOk}`);

    let newLive = false;
    for (let k = 1; k <= 20; k++) {
      const h = await getChunksHash();
      logLine(`chunk hash round ${k}: ${h}`);
      if (h && oldHash && h !== oldHash) {
        newLive = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 60_000));
    }
    logLine(`NEW_BUILD_LIVE=${newLive}`);

    if (newLive) {
      try {
        const before = await (await fetch(`${BASE}/api/exams`)).text();
        logLine(`exams before: ${before}`);
        if (!before.includes("پرسیدن راجب حذف شدن")) {
          const postRes = await fetch(`${BASE}/api/exams`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classId: "1",
              title: "پرسیدن راجب حذف شدن بعدش معرفی گرفتن تو یک ترم که هستم",
              date: "2026-11-03",
              time: "08:00",
              kind: "exam",
              location: "",
              color: "#00ff41",
              notes: "تستی تا صفحه\nکیر",
            }),
          });
          logLine(`post status: ${postRes.status}`);
          logLine(`post response: ${await postRes.text()}`);
          logLine(`EXAM_POSTED ${new Date().toISOString()}`);
        } else {
          logLine("EXAM_ALREADY_PRESENT");
        }
        logLine(`exams after: ${await (await fetch(`${BASE}/api/exams`)).text()}`);
      } catch (e) {
        logLine(`exam post error: ${(e as Error).message}`);
      }
    } else {
      logLine("POST_SKIPPED_OLD_BUILD (exam POST needs the new build for the notes field)");
    }

    logLine(`ALL_DONE ${new Date().toISOString()}`);
    process.exit(0);
  }
  logLine(`EXHAUSTED_AFTER_45_ATTEMPTS ${new Date().toISOString()}`);
  process.exit(1);
}

await main();
