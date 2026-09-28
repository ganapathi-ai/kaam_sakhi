import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { predictDisruption, type PredictionFeatures } from '@/lib/ml';

export const dynamic = 'force-dynamic';

/**
 * GET /api/predict?worker_id=<id>
 * Returns today's prediction for a worker
 */
export async function GET(req: NextRequest) {
  const workerId = req.nextUrl.searchParams.get('worker_id');
  if (!workerId) {
    return Response.json({ error: 'worker_id required' }, { status: 400 });
  }

  try {
    const worker = await queryOne<{ id: number; avg_cycle_length: number; name: string }>(
      'SELECT id, name, avg_cycle_length FROM workers WHERE id = $1',
      [workerId]
    );
    if (!worker) {
      return Response.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Fetch last 90 days of check-ins
    const checkins = await query<{
      checkin_date: string;
      pain_level: number;
      fatigue_level: number;
      sleep_quality: number;
      flow_present: boolean;
      workload: number;
      cycle_day: number;
      high_disruption: boolean;
    }>(
      `SELECT checkin_date, pain_level, fatigue_level, sleep_quality,
              flow_present, workload, cycle_day, high_disruption
       FROM checkins
       WHERE worker_id = $1
       ORDER BY checkin_date DESC
       LIMIT 90`,
      [workerId]
    );

    const hasHistory = checkins.length >= 30;
    const latest = checkins[0];
    const cycleLength = worker.avg_cycle_length ?? 28;

    // Build features from recent history
    const prevPain = checkins.length > 0
      ? checkins.slice(0, 7).reduce((s, c) => s + Number(c.pain_level), 0) / Math.min(7, checkins.length)
      : 1.5;
    const prevFatigue = checkins.length > 0
      ? checkins.slice(0, 7).reduce((s, c) => s + Number(c.fatigue_level), 0) / Math.min(7, checkins.length)
      : 1.5;
    const prevFlow = checkins.length > 0
      ? checkins.slice(0, 7).reduce((s, c) => s + Number(c.flow_present ? 1 : 0), 0) / Math.min(7, checkins.length) * 3
      : 1;

    // Estimate current cycle day
    const currentCycleDay = latest?.cycle_day
      ? Math.min(latest.cycle_day + 1, cycleLength)
      : Math.floor(Math.random() * cycleLength) + 1;

    // Did they have high disruption in the last 3 days?
    const recentDisruption = checkins.slice(0, 3).some(c => c.high_disruption) ? 1 : 0;

    const features: PredictionFeatures = {
      cycle_day: currentCycleDay,
      previous_pain: Number(prevPain.toFixed(2)),
      previous_fatigue: Number(prevFatigue.toFixed(2)),
      current_fatigue: latest ? Number(latest.fatigue_level) : 1.5,
      sleep_quality: latest ? Number(latest.sleep_quality) : 2,
      flow_level: Number(prevFlow.toFixed(2)),
      workload: latest ? Number(latest.workload) : 2,
      previous_disruption: recentDisruption,
    };

    const prediction = predictDisruption(features, hasHistory);

    // Store prediction in DB
    const today = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO predictions (worker_id, prediction_date, probability, risk_level, confidence, message_en)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (worker_id, prediction_date)
       DO UPDATE SET probability=$3, risk_level=$4, confidence=$5, message_en=$6`,
      [workerId, today, prediction.probability, prediction.risk_level, prediction.confidence, prediction.message_en]
    );

    return Response.json({
      worker_id: worker.id,
      worker_name: worker.name,
      prediction,
      features,
      cycle_day: currentCycleDay,
      history_days: checkins.length,
      has_history: hasHistory,
    });
  } catch (err) {
    console.error('Predict error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
