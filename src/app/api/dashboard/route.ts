import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * Returns aggregate stats for the admin dashboard
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  const whereW = orgId ? `WHERE w.org_id = ${parseInt(orgId)}` : '';
  const whereC = orgId ? `WHERE w.org_id = ${parseInt(orgId)}` : '';

  try {
    // Total workers
    const [workerStats] = await query<{
      total: number;
      active: number;
      by_occupation: string;
    }>(
      `SELECT
         COUNT(DISTINCT w.id) AS total,
         COUNT(DISTINCT CASE WHEN c.checkin_date >= NOW() - INTERVAL '7 days' THEN w.id END) AS active,
         json_agg(json_build_object('occ', w.occupation, 'count', occ_count)) AS by_occupation
       FROM workers w
       LEFT JOIN checkins c ON c.worker_id = w.id
       LEFT JOIN (
         SELECT occupation, COUNT(*) as occ_count FROM workers GROUP BY occupation
       ) occ ON occ.occupation = w.occupation
       ${whereW}`
    );

    // Checkin stats last 30 days
    const [checkinStats] = await query<{
      total_checkins: number;
      high_disruption_count: number;
      avg_pain: number;
      avg_fatigue: number;
      disruption_rate: number;
    }>(
      `SELECT
         COUNT(c.id) AS total_checkins,
         SUM(CASE WHEN c.high_disruption THEN 1 ELSE 0 END) AS high_disruption_count,
         ROUND(AVG(c.pain_level)::numeric, 2) AS avg_pain,
         ROUND(AVG(c.fatigue_level)::numeric, 2) AS avg_fatigue,
         ROUND(
           (SUM(CASE WHEN c.high_disruption THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(c.id), 0))::numeric,
           1
         ) AS disruption_rate
       FROM checkins c
       JOIN workers w ON w.id = c.worker_id
       WHERE c.checkin_date >= NOW() - INTERVAL '30 days'
       ${whereC ? 'AND ' + whereC.replace('WHERE ', '') : ''}`
    );

    // Prediction accuracy
    const [predStats] = await query<{
      total_predictions: number;
      high_risk_count: number;
      medium_risk_count: number;
      low_risk_count: number;
    }>(
      `SELECT
         COUNT(p.id) AS total_predictions,
         SUM(CASE WHEN p.risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_risk_count,
         SUM(CASE WHEN p.risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_risk_count,
         SUM(CASE WHEN p.risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_risk_count
       FROM predictions p
       JOIN workers w ON w.id = p.worker_id
       WHERE p.prediction_date >= NOW() - INTERVAL '30 days'
       ${whereC ? 'AND ' + whereC.replace('WHERE ', '') : ''}`
    );

    // Daily checkin trend (last 14 days)
    const trend = await query<{
      date: string;
      checkins: number;
      disruptions: number;
    }>(
      `SELECT
         c.checkin_date::text AS date,
         COUNT(c.id) AS checkins,
         SUM(CASE WHEN c.high_disruption THEN 1 ELSE 0 END) AS disruptions
       FROM checkins c
       JOIN workers w ON w.id = c.worker_id
       WHERE c.checkin_date >= NOW() - INTERVAL '14 days'
       ${whereC ? 'AND ' + whereC.replace('WHERE ', '') : ''}
       GROUP BY c.checkin_date
       ORDER BY c.checkin_date`
    );

    // Occupation breakdown
    const occupationBreakdown = await query<{
      occupation: string;
      worker_count: number;
      avg_disruption_rate: number;
    }>(
      `SELECT
         w.occupation,
         COUNT(DISTINCT w.id) AS worker_count,
         ROUND(
           (SUM(CASE WHEN c.high_disruption THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(c.id), 0))::numeric,
           1
         ) AS avg_disruption_rate
       FROM workers w
       LEFT JOIN checkins c ON c.worker_id = w.id AND c.checkin_date >= NOW() - INTERVAL '30 days'
       ${whereW}
       GROUP BY w.occupation
       ORDER BY worker_count DESC`
    );

    // Organizations
    const orgs = await query<{
      id: number;
      name: string;
      type: string;
      city: string;
      worker_count: number;
    }>(
      `SELECT o.id, o.name, o.type, o.city, COUNT(w.id) AS worker_count
       FROM organizations o
       LEFT JOIN workers w ON w.org_id = o.id
       GROUP BY o.id
       ORDER BY worker_count DESC`
    );

    return Response.json({
      workers: workerStats,
      checkins: checkinStats,
      predictions: predStats,
      trend,
      occupation_breakdown: occupationBreakdown,
      organizations: orgs,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
