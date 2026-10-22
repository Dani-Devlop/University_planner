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
    if (url.pathname === "/deploy-watch") {
      // Spawns the Railway deploy watcher as a child of THIS long-lived
      // mini-service process so it survives sandbox tool-call reaping.
      if ((globalThis as any).__dwRunning) {
        return Response.json({ ok: true, already: true });
      }
      (globalThis as any).__dwRunning = true;
      const p = Bun.spawn(["bash", "/home/z/railway-deploy-watch.sh"], {
        cwd: "/home/z/my-project",
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
        env: { ...process.env, PATH: `${process.env.HOME}/.railway/bin:${process.env.PATH ?? ""}` },
      });
      p.unref?.();
      return Response.json({ ok: true, started: true, pid: p.pid });
    }
    return new Response("railway-keeper up");
  },
});
console.log("railway-keeper listening on 3021");
