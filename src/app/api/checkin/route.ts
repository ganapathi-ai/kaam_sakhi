import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/checkin
 * Submit a daily check-in for a worker
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      worker_id,
      day_rating,
      pain_level,
      fatigue_level,
      sleep_quality,
      flow_present,
      workload,
      cycle_day,
    } = body;

    if (!worker_id) {
      return Response.json({ error: 'worker_id required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Determine ground truth disruption
    const high_disruption = day_rating === 3 || pain_level >= 2.5 || fatigue_level >= 2.5;

    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM checkins WHERE worker_id=$1 AND checkin_date=$2',
      [worker_id, today]
    );

    if (existing) {
      await query(
        `UPDATE checkins SET
           day_rating=$1, pain_level=$2, fatigue_level=$3,
           sleep_quality=$4, flow_present=$5, workload=$6, cycle_day=$7, high_disruption=$8
         WHERE worker_id=$9 AND checkin_date=$10`,
        [day_rating, pain_level, fatigue_level, sleep_quality,
         flow_present, workload, cycle_day, high_disruption, worker_id, today]
      );
    } else {
      await query(
        `INSERT INTO checkins
           (worker_id, checkin_date, day_rating, pain_level, fatigue_level,
            sleep_quality, flow_present, workload, cycle_day, high_disruption, is_synthetic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)`,
        [worker_id, today, day_rating, pain_level, fatigue_level,
         sleep_quality, flow_present, workload, cycle_day, high_disruption]
      );
    }

    return Response.json({
      success: true,
      checkin_date: today,
      high_disruption,
      message: high_disruption
        ? 'Difficult day recorded. We\'ll help you plan ahead.'
        : 'Check-in recorded. Keep going! 💪',
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/checkin?worker_id=<id>&days=30
 * Returns recent check-in history for a worker
 */
export async function GET(req: NextRequest) {
  const workerId = req.nextUrl.searchParams.get('worker_id');
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30');

  if (!workerId) {
    return Response.json({ error: 'worker_id required' }, { status: 400 });
  }

  try {
    const checkins = await query(
      `SELECT checkin_date, day_rating, pain_level, fatigue_level,
              sleep_quality, flow_present, workload, cycle_day, high_disruption
       FROM checkins
       WHERE worker_id = $1
         AND checkin_date >= NOW() - INTERVAL '${days} days'
       ORDER BY checkin_date DESC`,
      [workerId]
    );

    const stats = await queryOne<{
      total_checkins: number;
      high_disruption_days: number;
      avg_pain: number;
      avg_fatigue: number;
    }>(
      `SELECT
         COUNT(*) AS total_checkins,
         SUM(CASE WHEN high_disruption THEN 1 ELSE 0 END) AS high_disruption_days,
         ROUND(AVG(pain_level)::numeric, 2) AS avg_pain,
         ROUND(AVG(fatigue_level)::numeric, 2) AS avg_fatigue
       FROM checkins
       WHERE worker_id = $1
         AND checkin_date >= NOW() - INTERVAL '${days} days'`,
      [workerId]
    );

    return Response.json({ checkins, stats, days });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
