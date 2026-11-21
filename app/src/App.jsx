import React, { useEffect, useState } from 'react';

const THEME = {
  blue: { accent: '#3b82f6', badge: '#1d4ed8', label: 'BLUE (STABLE)' },
  green: { accent: '#10b981', badge: '#047857', label: 'GREEN (CANDIDATE)' },
  canary: { accent: '#f59e0b', badge: '#b45309', label: 'CANARY' },
};

export default function App() {
  const [meta, setMeta] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/version').then((r) => r.json()).then(setMeta).catch(() => {});
    fetchOrders();
  }, []);

  const theme = THEME[meta?.color] || THEME.blue;

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: '0 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${theme.accent}`, paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>ReleaseForge</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Order Management Service</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ background: theme.badge, padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
            {theme.label} · {meta?.version || '...'}
          </span>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Pod: {meta?.hostname || 'loading'}
          </div>
        </div>
      </header>

      <section style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Live Orders API</h2>
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{ background: theme.accent, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? 'Loading...' : 'Refresh /api/orders'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 14, background: '#7f1d1d', borderRadius: 6, color: '#fecaca' }}>
            API Error: {error}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: '#1e293b', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{order.id}</strong> — {order.item}
              </div>
              <div>
                <span style={{ marginRight: 16 }}>${order.amount.toFixed(2)}</span>
                <span style={{ color: theme.accent, fontWeight: 600 }}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}