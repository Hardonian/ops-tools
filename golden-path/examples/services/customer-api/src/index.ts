import express, { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationParams {
  limit: number;
  offset: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
}

interface ApiError {
  error: string;
  statusCode: number;
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
      service: 'customer-api',
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
// In-memory customer store (replace with database in production)
// ---------------------------------------------------------------------------

const CUSTOMERS: Customer[] = [
  {
    id: 'cust_a1b2c3',
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    phone: '+1-555-0101',
    createdAt: '2024-06-01T08:00:00.000Z',
    updatedAt: '2025-01-10T14:22:00.000Z',
  },
  {
    id: 'cust_d4e5f6',
    email: 'bob.smith@example.com',
    name: 'Bob Smith',
    phone: '+1-555-0102',
    createdAt: '2024-07-15T12:30:00.000Z',
    updatedAt: '2025-02-05T09:15:00.000Z',
  },
  {
    id: 'cust_g7h8i9',
    email: 'carol.davis@example.com',
    name: 'Carol Davis',
    phone: '+1-555-0103',
    createdAt: '2024-09-20T16:45:00.000Z',
    updatedAt: '2025-03-12T11:30:00.000Z',
  },
  {
    id: 'cust_j0k1l2',
    email: 'david.wilson@example.com',
    name: 'David Wilson',
    createdAt: '2024-11-05T10:00:00.000Z',
    updatedAt: '2025-04-01T08:00:00.000Z',
  },
  {
    id: 'cust_m3n4o5',
    email: 'eva.martinez@example.com',
    name: 'Eva Martinez',
    phone: '+1-555-0105',
    createdAt: '2025-01-10T14:20:00.000Z',
    updatedAt: '2025-06-20T17:45:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function parsePaginationParams(req: Request): PaginationParams {
  const rawLimit = typeof req.query.limit === 'string' ? req.query.limit : '20';
  const rawOffset = typeof req.query.offset === 'string' ? req.query.offset : '0';
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(rawOffset, 10) || 0, 0);
  return { limit, offset };
}

function isValidCustomerId(id: string): boolean {
  return /^cust_[a-zA-Z0-9]{6}$/.test(id);
}

// ---------------------------------------------------------------------------
// Express application
// ---------------------------------------------------------------------------

const app = express();

app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'customer-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.status(200).json(response);
});

// List customers
app.get('/api/v1/customers', (req: Request, res: Response) => {
  const { limit, offset } = parsePaginationParams(req);
  const paginatedData = CUSTOMERS.slice(offset, offset + limit);

  const response: PaginatedResponse<Customer> = {
    data: paginatedData,
    pagination: {
      limit,
      offset,
      total: CUSTOMERS.length,
    },
  };

  logger.info('Listed customers', {
    limit,
    offset,
    returned: paginatedData.length,
    total: CUSTOMERS.length,
  });

  res.status(200).json(response);
});

// Get customer by ID
app.get('/api/v1/customers/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (!isValidCustomerId(id)) {
    const error: ApiError = { error: 'Invalid customer ID', statusCode: 400 };
    res.status(400).json(error);
    return;
  }

  const customer = CUSTOMERS.find((c) => c.id === id);

  if (!customer) {
    logger.warn('Customer not found', { customerId: id });
    const error: ApiError = { error: 'Customer not found', statusCode: 404 };
    res.status(404).json(error);
    return;
  }

  logger.info('Fetched customer', { customerId: id });
  res.status(200).json(customer);
});

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

app.use((_req: Request, res: Response) => {
  const error: ApiError = { error: 'Not found', statusCode: 404 };
  res.status(404).json(error);
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
  });

  const error: ApiError = { error: 'Internal server error', statusCode: 500 };
  res.status(500).json(error);
});

// ---------------------------------------------------------------------------
// Server startup & graceful shutdown
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  logger.info('customer-api started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
  });
});

function shutdown(signal: string) {
  logger.info('Received shutdown signal', { signal });

  server.close(() => {
    logger.info('HTTP server closed', { signal });
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout', { signal });
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };
