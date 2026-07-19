import { execSync } from 'node:child_process';

const port = String(process.argv[2] ?? '5173');

function killPortWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('LISTENING')) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      console.log(`[dev:clean] Port ${targetPort} is already free.`);
      return;
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[dev:clean] Freed port ${targetPort} — stopped PID ${pid}`);
      } catch {
        console.warn(
          `[dev:clean] Could not stop PID ${pid}. Close that app manually if port ${targetPort} stays busy.`
        );
      }
    }
  } catch {
    console.log(`[dev:clean] Port ${targetPort} is already free.`);
  }
}

if (process.platform === 'win32') {
  killPortWindows(port);
} else {
  try {
    execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'ignore', shell: true });
    console.log(`[dev:clean] Freed port ${port}`);
  } catch {
    console.log(`[dev:clean] Port ${port} is already free.`);
  }
}
