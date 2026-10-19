const RAILWAY = process.env.HOME + "/.railway/bin/railway";
const LOG = "/tmp/rw-login/log.txt";

import { spawn, spawnSync } from "child_process";
import { mkdirSync, readFileSync, existsSync, rmSync } from "fs";

mkdirSync("/tmp/rw-login", { recursive: true });

let child: any = null;

function startLogin() {
  try { if (child) child.kill("SIGKILL"); } catch {}
  rmSync(LOG, { force: true });
  child = spawn(RAILWAY, ["login", "--browserless"], {
    detached: false,
    stdio: ["ignore", "ignore", "ignore"],
    env: { ...process.env, HOME: process.env.HOME },
  });
  // fallback: also capture output to log via shell wrapper
  return Bun.spawn(["bash", "-c", `${RAILWAY} login --browserless > ${LOG} 2>&1`], {
    stdin: "ignore", stdout: "ignore", stderr: "ignore",
  });
}

Bun.serve({
  port: 3021,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/start") {
      const p = startLogin();
      let log = "";
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (existsSync(LOG)) log = readFileSync(LOG, "utf8");
        if (log.includes("railway.com/activate")) break;
      }
      return Response.json({ ok: log.includes("activate"), log });
    }
    if (url.pathname === "/status") {
      const log = existsSync(LOG) ? readFileSync(LOG, "utf8") : "(no log)";
      return Response.json({ log });
    }
    if (url.pathname === "/whoami") {
      const r = spawnSync(RAILWAY, ["whoami"], { encoding: "utf8", env: { ...process.env } });
      return Response.json({ out: (r.stdout || "") + (r.stderr || ""), code: r.status });
    }
    return new Response("railway-keeper up");
  },
});
console.log("railway-keeper listening on 3021");
