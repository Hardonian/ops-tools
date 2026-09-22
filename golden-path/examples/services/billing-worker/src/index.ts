import http from 'node:http';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillingEvent {
  id: string;
  type: BillingEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

type BillingEventType =
  | 'order.created'
  | 'payment.received'
  | 'payment.failed'
  | 'invoice.overdue'
  | 'refund.requested';

interface ProcessedEvent {
  eventId: string;
  eventType: BillingEventType;
  result: 'success' | 'failed';
  processedAt: string;
  durationMs: number;
  error?: string;
}

interface WorkerStats {
  eventsProcessed: number;
  eventsFailed: number;
  lastHeartbeat: string;
  uptime: number;
  isShuttingDown: boolean;
}

// ---------------------------------------------------------------------------
// Structured Logger
// ---------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function createLogger(level: LogLevel = 'info') {
  const threshold = LOG_LEVELS[level];

  function log(lvl: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (LOG_LEVELS[lvl] < threshold) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: lvl,
      service: 'billing-worker',
      message,
      ...meta,
    };

    const output = JSON.stringify(entry);

    if (lvl === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  };
}

const logger = createLogger(
  (process.env.LOG_LEVEL as LogLevel) || 'info',
);

// ---------------------------------------------------------------------------
// Worker state
// ---------------------------------------------------------------------------

const stats: WorkerStats = {
  eventsProcessed: 0,
  eventsFailed: 0,
  lastHeartbeat: new Date().toISOString(),
  uptime: 0,
  isShuttingDown: false,
};

const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10);
const SHUTDOWN_TIMEOUT = 30_000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let eventPollTimer: ReturnType<typeof setTimeout> | null = null;
const inFlightEvents = new Set<string>();

// ---------------------------------------------------------------------------
// Event processing
// ---------------------------------------------------------------------------

async function processOrderCreated(event: BillingEvent): Promise<ProcessedEvent> {
  const start = Date.now();
  const orderId = (event.payload.orderId as string) ?? 'unknown';

  logger.info('Processing order.created event', {
    eventId: event.id,
    orderId,
  });

  // Simulate processing: generate invoice, calculate totals
  await simulateWork(50);

  return {
    eventId: event.id,
    eventType: event.type,
    result: 'success',
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

async function processPaymentReceived(event: BillingEvent): Promise<ProcessedEvent> {
  const start = Date.now();
  const paymentId = (event.payload.paymentId as string) ?? 'unknown';

  logger.info('Processing payment.received event', {
    eventId: event.id,
    paymentId,
  });

  await simulateWork(30);

  return {
    eventId: event.id,
    eventType: event.type,
    result: 'success',
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

async function processPaymentFailed(event: BillingEvent): Promise<ProcessedEvent> {
  const start = Date.now();
  const paymentId = (event.payload.paymentId as string) ?? 'unknown';
  const reason = (event.payload.reason as string) ?? 'unknown';

  logger.warn('Processing payment.failed event', {
    eventId: event.id,
    paymentId,
    reason,
  });

  await simulateWork(20);

  return {
    eventId: event.id,
    eventType: event.type,
    result: 'success',
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

async function processInvoiceOverdue(event: BillingEvent): Promise<ProcessedEvent> {
  const start = Date.now();
  const invoiceId = (event.payload.invoiceId as string) ?? 'unknown';

  logger.warn('Processing invoice.overdue event', {
    eventId: event.id,
    invoiceId,
  });

  await simulateWork(40);

  return {
    eventId: event.id,
    eventType: event.type,
    result: 'success',
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

async function processRefundRequested(event: BillingEvent): Promise<ProcessedEvent> {
  const start = Date.now();
  const refundId = (event.payload.refundId as string) ?? 'unknown';

  logger.info('Processing refund.requested event', {
    eventId: event.id,
    refundId,
  });

  await simulateWork(60);

  return {
    eventId: event.id,
    eventType: event.type,
    result: 'success',
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

const EVENT_HANDLERS: Record<BillingEventType, (event: BillingEvent) => Promise<ProcessedEvent>> = {
  'order.created': processOrderCreated,
  'payment.received': processPaymentReceived,
  'payment.failed': processPaymentFailed,
  'invoice.overdue': processInvoiceOverdue,
  'refund.requested': processRefundRequested,
};

function simulateWork(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processEvent(event: BillingEvent): Promise<ProcessedEvent> {
  const handler = EVENT_HANDLERS[event.type];

  if (!handler) {
    logger.error('Unknown event type', {
      eventType: event.type,
      eventId: event.id,
    });

    return {
      eventId: event.id,
      eventType: event.type,
      result: 'failed',
      processedAt: new Date().toISOString(),
      durationMs: 0,
      error: `Unknown event type: ${event.type}`,
    };
  }

  return handler(event);
}

// ---------------------------------------------------------------------------
// Simulated event source (replace with real queue consumer)
// ---------------------------------------------------------------------------

let eventSequence = 0;

function generateMockEvent(): BillingEvent {
  eventSequence++;
  const types: BillingEventType[] = [
    'order.created',
    'payment.received',
    'payment.failed',
    'invoice.overdue',
    'refund.requested',
  ];

  const type = types[eventSequence % types.length];

  return {
    id: `evt_${Date.now()}_${eventSequence}`,
    type,
    payload: {
      orderId: `ord_${1000 + eventSequence}`,
      paymentId: `pay_${2000 + eventSequence}`,
      invoiceId: `inv_${3000 + eventSequence}`,
      refundId: `ref_${4000 + eventSequence}`,
      amount: Math.round(Math.random() * 10000) / 100,
      currency: 'USD',
      reason: 'test',
    },
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Event polling loop
// ---------------------------------------------------------------------------

async function pollEvents(): Promise<void> {
  if (stats.isShuttingDown) {
    logger.info('Event polling stopped — shutting down');
    return;
  }

  // Simulate receiving events from a queue
  // In production, this would be a Redis Stream consumer, SQS poller, etc.
  if (Math.random() > 0.4) {
    const event = generateMockEvent();
    inFlightEvents.add(event.id);

    try {
      const result = await processEvent(event);

      if (result.result === 'success') {
        stats.eventsProcessed++;
        logger.debug('Event processed successfully', {
          eventId: event.id,
          eventType: event.type,
          durationMs: result.durationMs,
        });
      } else {
        stats.eventsFailed++;
        logger.error('Event processing failed', {
          eventId: event.id,
          eventType: event.type,
          error: result.error,
        });
      }
    } catch (err) {
      stats.eventsFailed++;
      logger.error('Unexpected error processing event', {
        eventId: event.id,
        eventType: event.type,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      inFlightEvents.delete(event.id);
    }
  }

  // Schedule next poll
  if (!stats.isShuttingDown) {
    eventPollTimer = setTimeout(pollEvents, 1000);
  }
}

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

function emitHeartbeat(): void {
  stats.uptime = process.uptime();
  stats.lastHeartbeat = new Date().toISOString();

  logger.info('heartbeat', {
    uptime: stats.uptime,
    eventsProcessed: stats.eventsProcessed,
    eventsFailed: stats.eventsFailed,
    inFlight: inFlightEvents.size,
    isShuttingDown: stats.isShuttingDown,
  });
}

// ---------------------------------------------------------------------------
// Health endpoint (for Kubernetes probes)
// ---------------------------------------------------------------------------

const HEALTH_PORT = parseInt(process.env.PORT || '3001', 10);

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    const status = stats.isShuttingDown ? 503 : 200;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: stats.isShuttingDown ? 'shutting_down' : 'ok',
        service: 'billing-worker',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        eventsProcessed: stats.eventsProcessed,
        eventsFailed: stats.eventsFailed,
        inFlightEvents: inFlightEvents.size,
      }),
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string): Promise<void> {
  return new Promise((resolve) => {
    logger.info('Shutdown initiated', { signal });
    stats.isShuttingDown = true;

    // Stop heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Stop accepting new events
    if (eventPollTimer) {
      clearTimeout(eventPollTimer);
      eventPollTimer = null;
    }

    // Emit final heartbeat
    emitHeartbeat();

    logger.info('Waiting for in-flight events to complete', {
      inFlight: inFlightEvents.size,
    });

    // Wait for in-flight events or timeout
    const deadline = Date.now() + SHUTDOWN_TIMEOUT;

    function waitForDrain(): void {
      if (inFlightEvents.size === 0 || Date.now() >= deadline) {
        // Close health server
        healthServer.close(() => {
          logger.info('Health server closed');

          if (inFlightEvents.size > 0) {
            logger.warn('Forced shutdown with in-flight events', {
              remaining: inFlightEvents.size,
            });
          }

          logger.info('Shutdown complete', {
            totalProcessed: stats.eventsProcessed,
            totalFailed: stats.eventsFailed,
          });

          resolve();
          return;
        });
        return;
      }

      setTimeout(waitForDrain, 100);
    }

    waitForDrain();
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function start(): void {
  logger.info('billing-worker starting', {
    heartbeatIntervalMs: HEARTBEAT_INTERVAL,
    healthPort: HEALTH_PORT,
    pid: process.pid,
  });

  // Start health endpoint
  healthServer.listen(HEALTH_PORT, () => {
    logger.info('Health endpoint listening', { port: HEALTH_PORT });
  });

  // Start heartbeat
  heartbeatTimer = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL);

  // Start event processing loop
  pollEvents();

  // Register shutdown handlers
  process.on('SIGTERM', async () => {
    await shutdown('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await shutdown('SIGINT');
    process.exit(0);
  });
}

start();
