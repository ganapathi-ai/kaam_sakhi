import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workers
 * Returns paginated worker list with latest prediction
 */
export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20');
  const orgId = req.nextUrl.searchParams.get('org_id');
  const offset = (page - 1) * limit;

  try {
    const whereClause = orgId ? `WHERE w.org_id = ${parseInt(orgId)}` : '';

    const workers = await query<{
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
    }>(
      `SELECT
         w.id, w.name, w.phone, w.age, w.occupation, w.location,
         o.name AS org_name,
         COUNT(c.id) AS checkin_count,
         MAX(c.checkin_date) AS last_checkin,
         p.risk_level AS latest_risk,
         p.probability AS latest_prob
       FROM workers w
       LEFT JOIN organizations o ON o.id = w.org_id
       LEFT JOIN checkins c ON c.worker_id = w.id
       LEFT JOIN LATERAL (
         SELECT risk_level, probability
         FROM predictions
         WHERE worker_id = w.id
         ORDER BY prediction_date DESC
         LIMIT 1
       ) p ON true
       ${whereClause}
       GROUP BY w.id, o.name, p.risk_level, p.probability
       ORDER BY w.id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const [{ total }] = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM workers ${whereClause ? whereClause : ''}`
    );

    return Response.json({
      workers,
      pagination: {
        page,
        limit,
        total: parseInt(total),
        pages: Math.ceil(parseInt(total) / limit),
      }
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/workers
 * Register a new worker
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, age, occupation, location, org_id, avg_cycle_length } = body;

    if (!name || !phone) {
      return Response.json({ error: 'name and phone are required' }, { status: 400 });
    }

    const worker = await queryOne<{ id: number }>(
      `INSERT INTO workers (name, phone, age, occupation, location, org_id, avg_cycle_length)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name
       RETURNING id`,
      [name, phone, age || null, occupation || null, location || null, org_id || null, avg_cycle_length || 28]
    );

    return Response.json({ success: true, worker_id: worker?.id });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
