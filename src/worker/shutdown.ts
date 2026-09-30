let shuttingDown = false;
const shutdownListeners: Array<() => void | Promise<void>> = [];

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function requestShutdown(): void {
  if (!shuttingDown) {
    shuttingDown = true;
    console.log("Shutdown signal received...");
    for (const listener of shutdownListeners) {
      try {
        listener();
      } catch (err) {
        console.error("Error executing shutdown listener:", err);
      }
    }
  }
}

export function onShutdown(listener: () => void | Promise<void>): void {
  shutdownListeners.push(listener);
}

// Register system handlers
process.on("SIGINT", () => requestShutdown());
process.on("SIGTERM", () => requestShutdown());

process.on("message", (msg) => {
  if (msg === "SIGINT" || msg === "SIGTERM" || msg === "shutdown") {
    console.log("Shutdown signal received via IPC...");
    requestShutdown();
  }
});

if (process.stdin.isTTY === false) {
  process.stdin.on("data", (data) => {
    if (data.toString().trim() === "shutdown") {
      console.log("Shutdown signal received via stdin...");
      requestShutdown();
    }
  });
}
