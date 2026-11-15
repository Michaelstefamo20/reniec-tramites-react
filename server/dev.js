import "dotenv/config";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const port = Number(process.env.API_PORT || process.env.PORT || 4175);
const apiPort = port;
const apiUrl = process.env.API_BASE_URL || `http://127.0.0.1:${apiPort}`;
const requestedWebPort = Number(process.env.VITE_PORT || 5173);
const webPort = await findAvailablePort(requestedWebPort);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const apiHealthUrl = `${apiUrl}/api/health`;

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port++) {
    const available = await new Promise((resolve) => {
      const probe = createServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (available) return port;
  }
  throw new Error(`No hay un puerto libre desde ${startPort}.`);
}

async function apiIsReady() {
  try {
    const response = await fetch(apiHealthUrl, { signal: AbortSignal.timeout(900) });
    if (!response.ok) return false;
    const data = await response.json();
    return data.api === "up" && data.database === "up";
  } catch { return false; }
}

function spawnNode(args, label) {
  const child = spawn(process.execPath, args, { cwd: projectRoot, stdio: "inherit", env: process.env, windowsHide: true });
  child.on("error", (error) => console.error(`[${label}] ${error.message}`));
  return child;
}

let api = null;
if (await apiIsReady()) {
  console.log(`[api] Reutilizando API lista en ${apiUrl}.`);
} else {
  api = spawnNode(["server/index.js"], "api");
  for (let attempt = 0; attempt < 32; attempt++) {
    if (await apiIsReady()) break;
    if (api.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  if (await apiIsReady()) console.log(`[api] API lista en ${apiUrl}.`);
  else console.warn(`[api] API no disponible en ${apiUrl}; Vite arrancará sin servicio API.`);
}

const viteScript = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
console.log(`[web] Usando puerto ${webPort}.`);
const web = spawnNode([viteScript, "--port", String(webPort)], "web");
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  web.kill("SIGTERM");
  api?.kill("SIGTERM");
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
web.on("exit", (code) => {
  if (!stopping) {
    stopping = true;
    api?.kill("SIGTERM");
    process.exitCode = code || 0;
  }
});
