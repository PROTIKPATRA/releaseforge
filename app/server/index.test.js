import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index.js';

describe('ReleaseForge API', () => {
  it('returns healthy status on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns version metadata on /version', async () => {
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('ReleaseForge');
  });

  it('exposes Prometheus metrics on /metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
  });

  it('returns orders on /api/orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });
});