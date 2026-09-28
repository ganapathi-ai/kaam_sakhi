import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateFullDataset } from '@/lib/synthetic';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seed
 * Seeds the database with synthetic workers + check-ins
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = body.days ?? 180;

    // First ensure schema exists
    await query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'ngo',
        city VARCHAR(100),
        contact_email VARCHAR(200),
        plan VARCHAR(50) DEFAULT 'pilot',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        age INTEGER,
        occupation VARCHAR(50),
        location VARCHAR(100),
        org_id INTEGER REFERENCES organizations(id),
        avg_cycle_length INTEGER DEFAULT 28,
        is_active BOOLEAN DEFAULT true,
        onboarded_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL REFERENCES workers(id),
        checkin_date DATE NOT NULL,
        day_rating INTEGER,
        pain_level NUMERIC(3,1),
        fatigue_level NUMERIC(3,1),
        sleep_quality NUMERIC(3,1),
        flow_present BOOLEAN DEFAULT false,
        workload NUMERIC(3,1),
        cycle_day INTEGER,
        high_disruption BOOLEAN DEFAULT false,
        is_synthetic BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(worker_id, checkin_date)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL REFERENCES workers(id),
        prediction_date DATE NOT NULL,
        probability NUMERIC(5,4),
        risk_level VARCHAR(10),
        confidence VARCHAR(20),
        message_en TEXT,
        actual_disruption BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(worker_id, prediction_date)
      )
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_checkins_worker_date ON checkins(worker_id, checkin_date DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_workers_org ON workers(org_id)`);

    // Seed organizations
    await query(`
      INSERT INTO organizations (name, type, city, contact_email, plan) VALUES
        ('Stree Shakti Foundation', 'ngo', 'Bengaluru', 'info@streeshakti.org', 'pilot'),
        ('Mahila Kamgar Cooperative', 'cooperative', 'Mumbai', 'contact@mkc.org', 'basic'),
        ('Urban Women Workers Trust', 'ngo', 'Delhi', 'uwwt@trust.in', 'pilot')
      ON CONFLICT DO NOTHING
    `);

    const { workers, checkins } = generateFullDataset(days);
    let workersInserted = 0;
    let checkinsInserted = 0;
    let skipped = 0;

    for (const w of workers) {
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM workers WHERE phone = $1', [w.phone]
      );
      if (existing) { skipped++; continue; }

      const row = await queryOne<{ id: number }>(
        `INSERT INTO workers (name, phone, age, occupation, location, org_id, avg_cycle_length)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [w.name, w.phone, w.age, w.occupation, w.location, w.org_id, w.avg_cycle_length]
      );

      if (!row) continue;
      workersInserted++;

      // Insert checkins in batches of 50
      const workerCheckins = checkins.filter(c => c.worker_phone === w.phone);
      for (let i = 0; i < workerCheckins.length; i += 50) {
        const batch = workerCheckins.slice(i, i + 50);
        for (const c of batch) {
          await query(
            `INSERT INTO checkins
              (worker_id, checkin_date, day_rating, pain_level, fatigue_level,
               sleep_quality, flow_present, workload, cycle_day, high_disruption, is_synthetic)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
             ON CONFLICT (worker_id, checkin_date) DO NOTHING`,
            [row.id, c.checkin_date, c.day_rating, c.pain_level, c.fatigue_level,
             c.sleep_quality, c.flow_present, c.workload, c.cycle_day, c.high_disruption]
          );
          checkinsInserted++;
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Synthetic data seeded successfully',
      stats: {
        workers_inserted: workersInserted,
        workers_skipped: skipped,
        checkins_inserted: checkinsInserted,
        days_per_worker: days,
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return Response.json(
      { error: 'Failed to seed data', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Returns current database counts
 */
export async function GET() {
  try {
    const [workers] = await query<{ count: string }>('SELECT COUNT(*) FROM workers');
    const [checkins] = await query<{ count: string }>('SELECT COUNT(*) FROM checkins');
    const [predictions] = await query<{ count: string }>('SELECT COUNT(*) FROM predictions');
    const [orgs] = await query<{ count: string }>('SELECT COUNT(*) FROM organizations');

    return Response.json({
      counts: {
        organizations: parseInt(orgs?.count ?? '0'),
        workers: parseInt(workers?.count ?? '0'),
        checkins: parseInt(checkins?.count ?? '0'),
        predictions: parseInt(predictions?.count ?? '0'),
      }
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
