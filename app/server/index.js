import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import client from 'prom-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json());

// Configurable release & fault-injection parameters
const config = {
  port: process.env.PORT || 8080,
  version: process.env.APP_VERSION || 'v1.0.0',
  color: process.env.APP_COLOR || 'blue', // blue | green | canary
  failRate: parseFloat(process.env.FAIL_RATE || '0'), // 0.0 to 1.0
  latencyMs: parseInt(process.env.LATENCY_MS || '0', 10),
  ready: process.env.APP_READY !== 'false',
};

// Prometheus metrics setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'route', 'status_code', 'version'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code', 'version'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

// Middleware to record metrics on API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.path,
      status_code: String(res.statusCode),
      version: config.version,
    };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
});

// Kubernetes Liveness Probe
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', version: config.version });
});

// Kubernetes Readiness Probe
app.get('/ready', (_req, res) => {
  if (!config.ready) {
    return res.status(503).json({ status: 'not_ready', version: config.version });
  }
  res.status(200).json({ status: 'ready', version: config.version });
});

// Release Metadata Endpoint
app.get('/version', (_req, res) => {
  res.status(200).json({
    app: 'ReleaseForge',
    version: config.version,
    color: config.color,
    failRate: config.failRate,
    latencyMs: config.latencyMs,
    hostname: process.env.HOSTNAME || 'local',
  });
});

// Prometheus Scrape Endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Simulated Order API (with fault & latency injection for Canary testing)
app.get('/api/orders', async (_req, res) => {
  if (config.latencyMs > 0) {
    await new Promise((r) => setTimeout(r, config.latencyMs));
  }

  if (config.failRate > 0 && Math.random() < config.failRate) {
    return res.status(500).json({
      error: 'Simulated payment gateway failure',
      version: config.version,
    });
  }

  res.status(200).json({
    version: config.version,
    color: config.color,
    orders: [
      { id: 'ORD-1001', item: 'Cloud Compute Unit', amount: 149.0, status: 'PAID' },
      { id: 'ORD-1002', item: 'Managed K8s Cluster', amount: 320.0, status: 'PROCESSING' },
      { id: 'ORD-1003', item: 'Observability Pack', amount: 85.0, status: 'PAID' },
    ],
  });
});

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`ReleaseForge ${config.version} (${config.color}) running on port ${config.port}`);
  });
}