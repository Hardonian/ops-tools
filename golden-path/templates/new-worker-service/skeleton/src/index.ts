const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10);

function processJob(): void {
  // TODO: Implement job processing logic
  console.log(`[{{ component_name }}] Processing job...`);
}

function heartbeat(): void {
  console.log(`[{{ component_name }}] Heartbeat at ${new Date().toISOString()}`);
}

async function start(): Promise<void> {
  console.log(`[{{ component_name }}] Worker started`);

  // Set up heartbeat
  setInterval(heartbeat, HEARTBEAT_INTERVAL);

  // Process jobs in a loop
  while (true) {
    try {
      processJob();
    } catch (error) {
      console.error(`[{{ component_name }}] Error processing job:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

start().catch(console.error);
