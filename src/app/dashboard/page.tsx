'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface DashboardData {
  workers: {
    total: number;
    active: number;
  };
  checkins: {
    total_checkins: number;
    high_disruption_count: number;
    avg_pain: number;
    avg_fatigue: number;
    disruption_rate: number;
  };
  predictions: {
    total_predictions: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  };
  trend: Array<{ date: string; checkins: number; disruptions: number }>;
  occupation_breakdown: Array<{
    occupation: string;
    worker_count: number;
    avg_disruption_rate: number;
  }>;
  organizations: Array<{
    id: number;
    name: string;
    type: string;
    city: string;
    worker_count: number;
  }>;
}

const OCC_LABELS: Record<string, { label: string; icon: string }> = {
  domestic_worker: { label: 'Domestic Worker', icon: '🏠' },
  street_vendor: { label: 'Street Vendor', icon: '🛒' },
  construction: { label: 'Construction', icon: '🏗️' },
  home_based: { label: 'Home-based', icon: '✂️' },
  waste_collector: { label: 'Waste Collector', icon: '♻️' },
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [dbCounts, setDbCounts] = useState<{ workers: number; checkins: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, seedRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/seed'),
      ]);
      const dashData = await dashRes.json();
      const seedData = await seedRes.json();

      if (dashRes.ok) setData(dashData);
      else setError(dashData.error ?? 'Failed to load dashboard');

      if (seedRes.ok) setDbCounts(seedData.counts);
    } catch {
      setError('Database not connected. Please set DATABASE_URL and seed data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedStatus('Seeding 9,000 synthetic check-ins... this may take 1–2 minutes');
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 180 }),
      });
      const result = await res.json();
      if (res.ok) {
        setSeedStatus(`✅ Seeded ${result.stats.workers_inserted} workers + ${result.stats.checkins_inserted.toLocaleString()} check-ins`);
        await fetchDashboard();
      } else {
        setSeedStatus(`❌ Error: ${result.error}`);
      }
    } catch (e) {
      setSeedStatus(`❌ Failed: ${String(e)}`);
    } finally {
      setSeeding(false);
    }
  };

  const maxCheckins = data?.trend.reduce((m, t) => Math.max(m, Number(t.checkins)), 1) ?? 1;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <span className="text-gradient">Dashboard</span>
            </h1>
            <p className={styles.pageSub}>
              NGO/Organization admin view · {data ? 'Live data' : 'Connect database to load'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              id="seed-btn"
              className={`btn btn-secondary ${seeding ? 'disabled' : ''}`}
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? <span className="spinner" /> : '🌱'}
              {seeding ? 'Seeding...' : 'Seed Synthetic Data'}
            </button>
            <button
              id="refresh-btn"
              className="btn btn-ghost"
              onClick={fetchDashboard}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : '↻'} Refresh
            </button>
          </div>
        </div>

        {/* Seed status */}
        {seedStatus && (
          <div className={`alert ${seedStatus.startsWith('✅') ? 'alert-success' : seedStatus.startsWith('❌') ? 'alert-danger' : 'alert-info'} animate-fade-in`}>
            {seedStatus}
          </div>
        )}

        {/* DB not connected banner */}
        {error && (
          <div className="alert alert-warning animate-fade-in">
            ⚠️ {error} — <strong>Set your DATABASE_URL in .env.local then click &quot;Seed Synthetic Data&quot;</strong>
          </div>
        )}

        {/* DB Counts */}
        {dbCounts && (
          <div className={`alert alert-info animate-fade-in`}>
            📊 Database: <strong>{dbCounts.workers} workers</strong> · <strong>{dbCounts.checkins.toLocaleString()} check-ins</strong>
            {dbCounts.workers === 0 && ' — Click "Seed Synthetic Data" to populate'}
          </div>
        )}

        {/* STAT CARDS */}
        <div className={`grid grid-4 animate-fade-up`} style={{ marginTop: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Workers</div>
            <div className="stat-value">
              {loading ? <span className="skeleton" style={{ width: 60, height: 36, display: 'block' }} /> : (data?.workers?.total ?? '—')}
            </div>
            <div className="stat-sub">Registered in system</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active (7 days)</div>
            <div className="stat-value">
              {loading ? <span className="skeleton" style={{ width: 50, height: 36, display: 'block' }} /> : (data?.workers?.active ?? '—')}
            </div>
            <div className="stat-sub">Submitted recent check-in</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Check-ins (30d)</div>
            <div className="stat-value">
              {loading ? <span className="skeleton" style={{ width: 70, height: 36, display: 'block' }} /> : (data?.checkins?.total_checkins?.toLocaleString() ?? '—')}
            </div>
            <div className="stat-sub">Daily symptom entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Disruption Rate</div>
            <div className="stat-value" style={{ color: 'var(--risk-medium)' }}>
              {loading ? <span className="skeleton" style={{ width: 55, height: 36, display: 'block' }} /> : (data?.checkins?.disruption_rate ? `${data.checkins.disruption_rate}%` : '—')}
            </div>
            <div className="stat-sub">High-disruption days / total</div>
          </div>
        </div>

        {/* ML PREDICTION STATS */}
        <div className={`grid grid-3 ${styles.row}`}>
          <div className={`card ${styles.predCard}`}>
            <div className="section-header">
              <div>
                <div className="section-title">Risk Distribution</div>
                <div className="section-sub">Last 30 days of predictions</div>
              </div>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 100 }} />
            ) : data?.predictions ? (
              <div className={styles.riskBars}>
                {[
                  { level: 'HIGH', count: data.predictions.high_risk_count, color: 'var(--risk-high)' },
                  { level: 'MEDIUM', count: data.predictions.medium_risk_count, color: 'var(--risk-medium)' },
                  { level: 'LOW', count: data.predictions.low_risk_count, color: 'var(--risk-low)' },
                ].map(({ level, count, color }) => {
                  const total = data.predictions.total_predictions || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={level} className={styles.riskBarRow}>
                      <span className={`risk-badge ${level}`}>{level}</span>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className={styles.riskCount}>{count} ({pct}%)</span>
                    </div>
                  );
                })}
                <div className={styles.totalPred}>
                  {data.predictions.total_predictions} total predictions
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No prediction data yet</div>
            )}
          </div>

          {/* Avg Symptoms */}
          <div className={`card ${styles.predCard}`}>
            <div className="section-header">
              <div>
                <div className="section-title">Avg Symptom Scores</div>
                <div className="section-sub">30-day rolling average (0–3 scale)</div>
              </div>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 100 }} />
            ) : data?.checkins ? (
              <div className={styles.symptomBars}>
                {[
                  { label: 'Avg Pain', val: data.checkins.avg_pain ?? 0, max: 3, color: 'var(--risk-high)' },
                  { label: 'Avg Fatigue', val: data.checkins.avg_fatigue ?? 0, max: 3, color: 'var(--risk-medium)' },
                  { label: 'Disruption Days', val: data.checkins.high_disruption_count ?? 0, max: data.checkins.total_checkins || 1, color: 'var(--brand-primary)', isCount: true },
                ].map(({ label, val, max, color, isCount }) => (
                  <div key={label} className={styles.symptomRow}>
                    <span className={styles.symptomLabel}>{label}</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${Math.min((val / max) * 100, 100)}%`, background: color }} />
                    </div>
                    <span className={styles.symptomVal}>
                      {isCount ? val.toLocaleString() : Number(val).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No symptom data yet</div>
            )}
          </div>

          {/* Organizations */}
          <div className={`card ${styles.predCard}`}>
            <div className="section-header">
              <div>
                <div className="section-title">Organizations</div>
                <div className="section-sub">Partner NGOs &amp; cooperatives</div>
              </div>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 100 }} />
            ) : (
              <div className={styles.orgList}>
                {(data?.organizations ?? []).map(org => (
                  <div key={org.id} className={styles.orgItem}>
                    <div className={styles.orgInfo}>
                      <div className={styles.orgName}>{org.name}</div>
                      <div className={styles.orgMeta}>{org.type} · {org.city}</div>
                    </div>
                    <div className={styles.orgCount}>{org.worker_count} workers</div>
                  </div>
                ))}
                {(!data?.organizations || data.organizations.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orgs yet</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TREND CHART */}
        <div className={`card ${styles.trendCard}`}>
          <div className="section-header">
            <div>
              <div className="section-title">Daily Check-in Trend</div>
              <div className="section-sub">Last 14 days · Purple = check-ins · Red = disruptions</div>
            </div>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : data?.trend && data.trend.length > 0 ? (
            <div className={styles.trendChart}>
              <div className={styles.chartBars}>
                {data.trend.map((t, i) => (
                  <div key={i} className={styles.chartBarGroup}>
                    <div className={styles.barStack}>
                      <div
                        className={`${styles.bar} ${styles.barCheckin}`}
                        style={{ height: `${(Number(t.checkins) / maxCheckins) * 80}px` }}
                        title={`${t.checkins} check-ins`}
                      />
                      <div
                        className={`${styles.bar} ${styles.barDisruption}`}
                        style={{ height: `${(Number(t.disruptions) / maxCheckins) * 80}px` }}
                        title={`${t.disruptions} disruptions`}
                      />
                    </div>
                    <div className={styles.barLabel}>{formatDate(t.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
              No trend data yet. Seed synthetic data to see chart.
            </div>
          )}
        </div>

        {/* OCCUPATION BREAKDOWN */}
        <div className={`card ${styles.occCard}`}>
          <div className="section-header">
            <div className="section-title">By Occupation</div>
            <div className="section-sub">Worker count + disruption rate</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Occupation</th>
                  <th>Workers</th>
                  <th>Avg Disruption Rate (30d)</th>
                  <th>Risk Bar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : (data?.occupation_breakdown ?? []).map(occ => {
                  const meta = OCC_LABELS[occ.occupation] ?? { label: occ.occupation, icon: '👷' };
                  const rate = Number(occ.avg_disruption_rate ?? 0);
                  const riskColor = rate > 40 ? 'var(--risk-high)' : rate > 25 ? 'var(--risk-medium)' : 'var(--risk-low)';
                  return (
                    <tr key={occ.occupation}>
                      <td>
                        <div className="flex gap-2" style={{ alignItems: 'center' }}>
                          <span className="occ-icon">{meta.icon}</span>
                          {meta.label}
                        </div>
                      </td>
                      <td>{occ.worker_count}</td>
                      <td style={{ color: riskColor, fontWeight: 600 }}>{rate}%</td>
                      <td style={{ width: 160 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(rate, 100)}%`, background: riskColor }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && (!data?.occupation_breakdown || data.occupation_breakdown.length === 0) && (
                  <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No data — seed first</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Workers link */}
        <div className={styles.footerAction}>
          <Link href="/workers" className="btn btn-primary" id="view-workers-btn">
            View All Workers →
          </Link>
        </div>
      </div>
    </div>
  );
}
