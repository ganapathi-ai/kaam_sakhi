'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './workers.module.css';

interface Worker {
  id: number;
  name: string;
  phone: string;
  age: number;
  occupation: string;
  location: string;
  org_name: string;
  checkin_count: number;
  last_checkin: string | null;
  latest_risk: string | null;
  latest_prob: number | null;
}

const OCC_LABELS: Record<string, { label: string; icon: string }> = {
  domestic_worker: { label: 'Domestic Worker', icon: '🏠' },
  street_vendor: { label: 'Street Vendor', icon: '🛒' },
  construction: { label: 'Construction', icon: '🏗️' },
  home_based: { label: 'Home-based', icon: '✂️' },
  waste_collector: { label: 'Waste Collector', icon: '♻️' },
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/workers?${params}`);
      const data = await res.json();
      if (res.ok) {
        setWorkers(data.workers);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load workers. Make sure the database is connected.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || w.latest_risk === filter || w.occupation === filter;
    return matchSearch && matchFilter;
  });

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Workers <span className="text-gradient">Registry</span></h1>
            <p className={styles.sub}>{pagination.total} registered workers · {pagination.pages} pages</p>
          </div>
          <div className={styles.headerActions}>
            <select
              id="risk-filter"
              className="form-select"
              style={{ width: 160 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">🔴 High Risk</option>
              <option value="MEDIUM">⚠️ Medium Risk</option>
              <option value="LOW">✅ Low Risk</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <input
            id="worker-search"
            className="form-input"
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Occupation</th>
                <th>Location / Org</th>
                <th>Check-ins</th>
                <th>Last Check-in</th>
                <th>Risk Today</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 120 : 80 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    {search || filter ? 'No workers match your filters' : 'No workers yet — seed synthetic data on the Dashboard'}
                  </td>
                </tr>
              ) : (
                filtered.map(w => {
                  const occ = OCC_LABELS[w.occupation] ?? { label: w.occupation, icon: '👷' };
                  return (
                    <tr key={w.id} className={styles.workerRow}>
                      <td>
                        <div className={styles.workerCell}>
                          <div className={styles.workerAvatar}>{w.name.charAt(0)}</div>
                          <div>
                            <div className={styles.workerName}>{w.name}</div>
                            <div className={styles.workerPhone}>{w.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2" style={{ alignItems: 'center' }}>
                          <span>{occ.icon}</span>
                          <span style={{ fontSize: '0.82rem' }}>{occ.label}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{w.location}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{w.org_name ?? '—'}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{Number(w.checkin_count).toLocaleString()}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {formatDate(w.last_checkin)}
                      </td>
                      <td>
                        {w.latest_risk ? (
                          <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
                            <span className={`risk-badge ${w.latest_risk}`}>{w.latest_risk}</span>
                            {w.latest_prob !== null && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {Math.round(Number(w.latest_prob) * 100)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No prediction</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/checkin?worker_id=${w.id}`}
                          className="btn btn-ghost btn-sm"
                          id={`predict-btn-${w.id}`}
                        >
                          Check-in →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              id="prev-page"
            >
              ← Previous
            </button>
            <span className={styles.pageInfo}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} workers
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === pagination.pages}
              onClick={() => setPage(p => p + 1)}
              id="next-page"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
