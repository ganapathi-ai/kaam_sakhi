/**
 * KaamSakhi Synthetic Data Generator
 *
 * Generates realistic menstrual cycle + work-disruption data for 50 synthetic workers.
 * 6 months of daily check-ins per worker (≈180 rows × 50 = 9,000 rows).
 *
 * Realism features:
 * - Each worker has a personal baseline cycle length (21–35 days, normally distributed)
 * - Cycle-day-based symptom patterns (pain peaks days 1-3, PMS days 24-28)
 * - Occupation-specific workload profiles
 * - Realistic noise/variation per individual
 * - Ground truth disruption labels based on combined symptom thresholds
 */

export interface SyntheticWorker {
  name: string;
  age: number;
  occupation: 'domestic_worker' | 'street_vendor' | 'construction' | 'home_based' | 'waste_collector';
  location: string;
  phone: string;
  org_id: number;
  avg_cycle_length: number;
  baseline_pain: number;     // Personal pain sensitivity 0-3
  baseline_fatigue: number;
}

export interface SyntheticCheckin {
  worker_phone: string;
  checkin_date: string;      // YYYY-MM-DD
  day_rating: number;        // 1=comfortable, 2=some, 3=difficult
  pain_level: number;        // 0-3
  fatigue_level: number;     // 0-3
  sleep_quality: number;     // 0-3 (3=best)
  flow_present: boolean;
  workload: number;          // 0-3
  cycle_day: number;
  high_disruption: boolean;  // Ground truth label
}

const OCCUPATIONS = {
  domestic_worker: { base_workload: 2.2, workload_variance: 0.5 },
  street_vendor: { base_workload: 2.5, workload_variance: 0.6 },
  construction: { base_workload: 2.8, workload_variance: 0.5 },
  home_based: { base_workload: 1.8, workload_variance: 0.7 },
  waste_collector: { base_workload: 2.6, workload_variance: 0.4 },
};

const NAMES = [
  'Lakshmi K', 'Rehana B', 'Sushila D', 'Meena P', 'Asha R',
  'Savita M', 'Priya T', 'Kamala S', 'Radha N', 'Sunita G',
  'Fatima A', 'Kaveri J', 'Deepa L', 'Usha C', 'Geetha V',
  'Anita H', 'Saroja F', 'Kumari W', 'Lalitha X', 'Nirmala Y',
  'Padma Z', 'Girija AA', 'Vasantha BB', 'Manjula CC', 'Ambika DD',
  'Rajamma EE', 'Sarala FF', 'Bhavani GG', 'Sowmya HH', 'Rekha II',
  'Indira JJ', 'Sharada KK', 'Tulasi LL', 'Malathi MM', 'Hema NN',
  'Vijaya OO', 'Sulochana PP', 'Chandrika QQ', 'Mythili RR', 'Kousalya SS',
  'Janaki TT', 'Vimala UU', 'Sumathi VV', 'Chandra WW', 'Saraswathi XX',
  'Rukmini YY', 'Leela ZZ', 'Devaki AB', 'Sarojini AC', 'Meenakshi AD',
];

const LOCATIONS = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

// Seeded random for reproducibility
let seed = 42;
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randGaussian(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.max(0.0001, Math.min(0.9999, seededRandom()));
  const u2 = seededRandom();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.min(3, mean + std * z));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Generate cycle-day-adjusted symptom probability
 */
function getCycleDayFactor(cycleDay: number, cycleLength: number): {
  painFactor: number;
  fatigueFactor: number;
  flowPresent: boolean;
} {
  const relDay = cycleDay / cycleLength;
  const menstrualPhase = cycleDay <= 5;
  const premenstrualPhase = cycleDay >= cycleLength - 6;

  let painFactor = 0.1;
  let fatigueFactor = 0.15;

  if (menstrualPhase) {
    painFactor = cycleDay <= 2 ? 0.85 : 0.65 - (cycleDay - 3) * 0.1;
    fatigueFactor = 0.70;
  } else if (premenstrualPhase) {
    const daysFromEnd = cycleLength - cycleDay;
    painFactor = 0.5 - daysFromEnd * 0.06;
    fatigueFactor = 0.55 - daysFromEnd * 0.05;
  } else if (relDay > 0.35 && relDay < 0.55) {
    // Ovulation — slight dip in symptoms
    painFactor = 0.05;
    fatigueFactor = 0.08;
  }

  return {
    painFactor: clamp(painFactor, 0, 1),
    fatigueFactor: clamp(fatigueFactor, 0, 1),
    flowPresent: cycleDay <= 6,
  };
}

/**
 * Generate 50 synthetic workers
 */
export function generateSyntheticWorkers(): SyntheticWorker[] {
  const occTypes = Object.keys(OCCUPATIONS) as (keyof typeof OCCUPATIONS)[];
  return NAMES.map((name, i) => {
    const occupation = occTypes[i % occTypes.length];
    return {
      name,
      age: Math.floor(18 + seededRandom() * 32),
      occupation,
      location: LOCATIONS[i % LOCATIONS.length],
      phone: `+91${9000000000 + i}`,
      org_id: (i % 3) + 1,
      avg_cycle_length: Math.round(clamp(randGaussian(28, 4), 21, 35)),
      baseline_pain: roundTo1(clamp(randGaussian(1.2, 0.6), 0, 3)),
      baseline_fatigue: roundTo1(clamp(randGaussian(1.3, 0.6), 0, 3)),
    };
  });
}

/**
 * Generate 6 months of daily check-ins for a single worker
 */
export function generateWorkerCheckins(
  worker: SyntheticWorker,
  startDate: Date,
  daysCount = 180
): SyntheticCheckin[] {
  const checkins: SyntheticCheckin[] = [];
  const occ = OCCUPATIONS[worker.occupation];

  let currentCycleStart = 0; // First cycle starts at day 0
  let cycleLength = worker.avg_cycle_length;
  let cycleDay = Math.floor(seededRandom() * cycleLength) + 1; // Random start phase

  for (let d = 0; d < daysCount; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    // Update cycle day
    if (cycleDay > cycleLength) {
      cycleDay = 1;
      // Each new cycle length varies slightly
      cycleLength = Math.round(clamp(
        worker.avg_cycle_length + randGaussian(0, 2),
        21, 35
      ));
    }

    const { painFactor, fatigueFactor, flowPresent } = getCycleDayFactor(cycleDay, cycleLength);

    // Personal baseline + cycle factor + noise
    const rawPain = worker.baseline_pain * 0.4 + painFactor * 3 * 0.6 + randGaussian(0, 0.3);
    const rawFatigue = worker.baseline_fatigue * 0.4 + fatigueFactor * 3 * 0.6 + randGaussian(0, 0.4);
    const rawSleep = clamp(3 - rawFatigue * 0.6 + randGaussian(0, 0.5), 0, 3);
    const rawWorkload = clamp(occ.base_workload + randGaussian(0, occ.workload_variance), 0, 3);

    const pain = clamp(Math.round(rawPain * 10) / 10, 0, 3);
    const fatigue = clamp(Math.round(rawFatigue * 10) / 10, 0, 3);
    const sleep = clamp(Math.round(rawSleep * 10) / 10, 0, 3);
    const workload = clamp(Math.round(rawWorkload * 10) / 10, 0, 3);

    // Ground truth: high disruption if symptoms exceed thresholds
    const disruptionScore = pain * 0.4 + fatigue * 0.3 + workload * 0.2 + (flowPresent ? 0.3 : 0) - sleep * 0.15;
    const high_disruption = disruptionScore > 2.0;

    // Day rating (1-3) based on disruption
    const day_rating = high_disruption ? 3 : (disruptionScore > 1.2 ? 2 : 1);

    checkins.push({
      worker_phone: worker.phone,
      checkin_date: dateStr,
      day_rating,
      pain_level: pain,
      fatigue_level: fatigue,
      sleep_quality: sleep,
      flow_present: flowPresent,
      workload,
      cycle_day: cycleDay,
      high_disruption,
    });

    cycleDay++;
  }

  return checkins;
}

/**
 * Generate full synthetic dataset: all workers + all check-ins
 */
export function generateFullDataset(daysCount = 180): {
  workers: SyntheticWorker[];
  checkins: SyntheticCheckin[];
} {
  // Reset seed for reproducibility
  seed = 42;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount);

  const workers = generateSyntheticWorkers();
  const checkins: SyntheticCheckin[] = [];

  for (const worker of workers) {
    const workerCheckins = generateWorkerCheckins(worker, startDate, daysCount);
    checkins.push(...workerCheckins);
  }

  return { workers, checkins };
}
