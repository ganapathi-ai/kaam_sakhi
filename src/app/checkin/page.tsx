'use client';

import { useState } from 'react';
import styles from './checkin.module.css';

const OCCUPATIONS = [
  { value: 'domestic_worker', label: '🏠 Domestic Worker' },
  { value: 'street_vendor', label: '🛒 Street Vendor' },
  { value: 'construction', label: '🏗️ Construction' },
  { value: 'home_based', label: '✂️ Home-based Worker' },
  { value: 'waste_collector', label: '♻️ Waste Collector' },
];

const DAY_RATINGS = [
  { value: 1, label: 'Comfortable', emoji: '😊', color: 'var(--risk-low)' },
  { value: 2, label: 'Some discomfort', emoji: '😐', color: 'var(--risk-medium)' },
  { value: 3, label: 'Difficult', emoji: '😣', color: 'var(--risk-high)' },
];

export default function CheckinPage() {
  const [step, setStep] = useState<'register' | 'checkin' | 'result'>('checkin');
  const [workerId, setWorkerId] = useState('1'); // Default for demo
  const [form, setForm] = useState({
    day_rating: 1,
    pain_level: 0,
    fatigue_level: 0,
    sleep_quality: 3,
    flow_present: false,
    workload: 2,
    cycle_day: 14,
  });
  const [prediction, setPrediction] = useState<{
    probability: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    message_en: string;
    message_hi: string;
    message_kn: string;
    confidence: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Submit check-in
      const checkinRes = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: parseInt(workerId), ...form }),
      });
      const checkinData = await checkinRes.json();

      if (!checkinRes.ok) {
        setError(checkinData.error ?? 'Check-in failed');
        return;
      }

      // Get prediction
      const predRes = await fetch(`/api/predict?worker_id=${workerId}`);
      const predData = await predRes.json();

      if (predRes.ok) {
        setPrediction(predData.prediction);
        setStep('result');
      } else {
        setError(predData.error ?? 'Prediction failed');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('checkin');
    setPrediction(null);
    setError(null);
    setForm({
      day_rating: 1,
      pain_level: 0,
      fatigue_level: 0,
      sleep_quality: 3,
      flow_present: false,
      workload: 2,
      cycle_day: 14,
    });
  };

  const sliderLabel = (val: number, labels: string[]) => labels[Math.min(Math.round(val), labels.length - 1)] ?? val;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.inner}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>🌸</div>
            <div>
              <h1 className={styles.title}>Daily Check-in</h1>
              <p className={styles.subtitle}>20 seconds · Helps KaamSakhi predict your next difficult day</p>
            </div>
          </div>

          {/* WhatsApp style disclaimer */}
          <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
            📱 In production, this check-in happens over WhatsApp. This is the web simulation.
            <br />⚠️ <strong>This tool does not diagnose any medical condition.</strong>
          </div>

          {/* Worker ID input */}
          <div className={`card ${styles.workerCard}`}>
            <label className="form-label" htmlFor="worker-id-input">Worker ID (for demo)</label>
            <div className={styles.workerRow}>
              <input
                id="worker-id-input"
                className="form-input"
                type="number"
                min={1}
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                placeholder="Enter worker ID (e.g. 1–50)"
              />
              <span className={styles.workerHint}>Try 1–50 after seeding</span>
            </div>
          </div>

          {step === 'checkin' && (
            <div className={`card ${styles.formCard} animate-fade-up`}>
              {/* Day Rating */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>How was your day today?</div>
                <div className={styles.ratingButtons}>
                  {DAY_RATINGS.map(r => (
                    <button
                      key={r.value}
                      id={`day-rating-${r.value}`}
                      className={`${styles.ratingBtn} ${form.day_rating === r.value ? styles.ratingSelected : ''}`}
                      style={form.day_rating === r.value ? { borderColor: r.color, background: `${r.color}15` } : {}}
                      onClick={() => setForm(f => ({ ...f, day_rating: r.value }))}
                    >
                      <span className={styles.ratingEmoji}>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Pain level</div>
                <div className="slider-group">
                  <div className="slider-row">
                    <input
                      id="pain-slider"
                      type="range" min={0} max={3} step={0.5}
                      className="slider"
                      value={form.pain_level}
                      onChange={e => setForm(f => ({ ...f, pain_level: parseFloat(e.target.value) }))}
                    />
                    <span className="slider-value">{form.pain_level}</span>
                  </div>
                  <div className={styles.sliderHint}>
                    {sliderLabel(form.pain_level, ['No pain', 'Mild', 'Moderate', 'High pain'])}
                  </div>
                </div>
              </div>

              {/* Fatigue */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Energy / Fatigue</div>
                <div className="slider-group">
                  <div className="slider-row">
                    <input
                      id="fatigue-slider"
                      type="range" min={0} max={3} step={0.5}
                      className="slider"
                      value={form.fatigue_level}
                      onChange={e => setForm(f => ({ ...f, fatigue_level: parseFloat(e.target.value) }))}
                    />
                    <span className="slider-value">{form.fatigue_level}</span>
                  </div>
                  <div className={styles.sliderHint}>
                    {sliderLabel(form.fatigue_level, ['High energy', 'Okay', 'Tired', 'Exhausted'])}
                  </div>
                </div>
              </div>

              {/* Sleep */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Sleep quality last night</div>
                <div className="slider-group">
                  <div className="slider-row">
                    <input
                      id="sleep-slider"
                      type="range" min={0} max={3} step={0.5}
                      className="slider"
                      value={form.sleep_quality}
                      onChange={e => setForm(f => ({ ...f, sleep_quality: parseFloat(e.target.value) }))}
                    />
                    <span className="slider-value">{form.sleep_quality}</span>
                  </div>
                  <div className={styles.sliderHint}>
                    {sliderLabel(form.sleep_quality, ['Very poor', 'Poor', 'Okay', 'Good'])}
                  </div>
                </div>
              </div>

              {/* Workload */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Workload today</div>
                <div className="slider-group">
                  <div className="slider-row">
                    <input
                      id="workload-slider"
                      type="range" min={0} max={3} step={0.5}
                      className="slider"
                      value={form.workload}
                      onChange={e => setForm(f => ({ ...f, workload: parseFloat(e.target.value) }))}
                    />
                    <span className="slider-value">{form.workload}</span>
                  </div>
                  <div className={styles.sliderHint}>
                    {sliderLabel(form.workload, ['Light', 'Moderate', 'Heavy', 'Very heavy'])}
                  </div>
                </div>
              </div>

              {/* Cycle day */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Approx. cycle day (1 = first day of period)</div>
                <div className="slider-group">
                  <div className="slider-row">
                    <input
                      id="cycle-day-slider"
                      type="range" min={1} max={35} step={1}
                      className="slider"
                      value={form.cycle_day}
                      onChange={e => setForm(f => ({ ...f, cycle_day: parseInt(e.target.value) }))}
                    />
                    <span className="slider-value">Day {form.cycle_day}</span>
                  </div>
                </div>
              </div>

              {/* Flow */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Currently on your period?</div>
                <div className={styles.flowButtons}>
                  {[{ v: true, label: 'Yes' }, { v: false, label: 'No / Not sure' }].map(({ v, label }) => (
                    <button
                      key={String(v)}
                      id={`flow-${v}`}
                      className={`${styles.flowBtn} ${form.flow_present === v ? styles.flowSelected : ''}`}
                      onClick={() => setForm(f => ({ ...f, flow_present: v }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                id="submit-checkin"
                className={`btn btn-primary ${styles.submitBtn}`}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <><span className="spinner" /> Getting prediction...</> : '🔮 Get Today\'s Prediction'}
              </button>
            </div>
          )}

          {step === 'result' && prediction && (
            <div className={`card ${styles.resultCard} animate-scale-in`}>
              <div className={styles.resultHeader}>
                <div className={styles.resultIcon}>
                  {prediction.risk_level === 'HIGH' ? '🔴' : prediction.risk_level === 'MEDIUM' ? '⚠️' : '✅'}
                </div>
                <div>
                  <div className={styles.resultTitle}>Your prediction for the next 2 days</div>
                  <div className={`risk-badge ${prediction.risk_level} ${styles.resultBadge}`}>
                    {prediction.risk_level} RISK
                  </div>
                </div>
              </div>

              <div className={styles.probBar}>
                <div className={styles.probLabel}>Disruption probability</div>
                <div className="progress-bar" style={{ height: 12, marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${prediction.probability * 100}%`,
                      background: prediction.risk_level === 'HIGH' ? 'var(--risk-high)'
                        : prediction.risk_level === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)'
                    }}
                  />
                </div>
                <div className={styles.probValue}>{Math.round(prediction.probability * 100)}%</div>
              </div>

              <div className={styles.messages}>
                <div className={styles.msg}>
                  <div className={styles.msgLang}>English</div>
                  <p>{prediction.message_en}</p>
                </div>
                <div className={styles.msg}>
                  <div className={styles.msgLang}>हिंदी</div>
                  <p>{prediction.message_hi}</p>
                </div>
                <div className={styles.msg}>
                  <div className={styles.msgLang}>ಕನ್ನಡ</div>
                  <p>{prediction.message_kn}</p>
                </div>
              </div>

              <div className={styles.confidenceNote}>
                Model: <strong>{prediction.confidence}</strong> prediction ·
                {prediction.confidence === 'rule-based' && ' Not enough history yet — check in daily to personalize'}
                {prediction.confidence === 'model' && ' Personalized to your cycle pattern'}
              </div>

              <div className={styles.disclaimer}>
                ⚕️ This is a work-disruption risk estimate, not a medical diagnosis.
                For unusual or severe symptoms, please consult a healthcare professional.
              </div>

              <div className={styles.resultActions}>
                <button id="new-checkin-btn" className="btn btn-primary" onClick={resetForm}>
                  ← New Check-in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
