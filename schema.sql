-- KaamSakhi Database Schema
-- Run this in your Neon PostgreSQL console to initialize the database

-- Organizations (NGOs, cooperatives, employers)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('ngo', 'cooperative', 'employer', 'csr')),
  city VARCHAR(100),
  contact_email VARCHAR(200),
  plan VARCHAR(50) DEFAULT 'pilot' CHECK (plan IN ('pilot', 'basic', 'standard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workers (women informal workers)
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  age INTEGER,
  occupation VARCHAR(50) CHECK (occupation IN (
    'domestic_worker', 'street_vendor', 'construction',
    'home_based', 'waste_collector', 'other'
  )),
  location VARCHAR(100),
  org_id INTEGER REFERENCES organizations(id),
  avg_cycle_length INTEGER DEFAULT 28,
  is_active BOOLEAN DEFAULT true,
  onboarded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  checkin_date DATE NOT NULL,
  day_rating INTEGER CHECK (day_rating BETWEEN 1 AND 3), -- 1=comfortable, 2=some, 3=difficult
  pain_level NUMERIC(3,1) CHECK (pain_level BETWEEN 0 AND 3),
  fatigue_level NUMERIC(3,1) CHECK (fatigue_level BETWEEN 0 AND 3),
  sleep_quality NUMERIC(3,1) CHECK (sleep_quality BETWEEN 0 AND 3),
  flow_present BOOLEAN DEFAULT false,
  workload NUMERIC(3,1) CHECK (workload BETWEEN 0 AND 3),
  cycle_day INTEGER,
  high_disruption BOOLEAN DEFAULT false, -- Ground truth label
  is_synthetic BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, checkin_date)
);

-- ML predictions
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  prediction_date DATE NOT NULL,
  probability NUMERIC(5,4),
  risk_level VARCHAR(10) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  confidence VARCHAR(20) CHECK (confidence IN ('rule-based', 'model')),
  message_en TEXT,
  actual_disruption BOOLEAN, -- Filled in after the fact
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, prediction_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_worker_date ON checkins(worker_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_worker ON predictions(worker_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_workers_org ON workers(org_id);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);

-- Seed default organizations
INSERT INTO organizations (name, type, city, contact_email, plan) VALUES
  ('Stree Shakti Foundation', 'ngo', 'Bengaluru', 'info@streeshakti.org', 'pilot'),
  ('Mahila Kamgar Cooperative', 'cooperative', 'Mumbai', 'contact@mkc.org', 'basic'),
  ('Urban Women Workers Trust', 'ngo', 'Delhi', 'uwwt@trust.in', 'pilot')
ON CONFLICT DO NOTHING;
