import Link from 'next/link';
import styles from './page.module.css';

const STATS = [
  { value: '17.3Cr', label: 'Registered women workers in India' },
  { value: '67.7%', label: 'Women wanting more flexibility during periods' },
  { value: '48%', label: 'Working women affected by PMS' },
  { value: '20s', label: 'Daily check-in time' },
];

const PERSONAS = [
  {
    emoji: '🏠',
    name: 'Lakshmi, 32',
    role: 'Domestic Worker · Bengaluru',
    quote: 'If I know beforehand that those two days will be difficult, I can plan my work better.',
  },
  {
    emoji: '🛒',
    name: 'Rehana, 28',
    role: 'Street Vendor · Mumbai',
    quote: 'I cannot close my stall just because I have pain. If I lose one day, I lose that day\'s money.',
  },
  {
    emoji: '🏗️',
    name: 'Sushila, 38',
    role: 'Construction Helper · Delhi',
    quote: 'The problem is not only the pain. I still have to carry things and finish the work.',
  },
  {
    emoji: '✂️',
    name: 'Meena, 26',
    role: 'Home-based Garment · Pune',
    quote: 'If I finish fewer pieces, I earn less. I cannot simply take a sick day.',
  },
  {
    emoji: '♻️',
    name: 'Asha, 43',
    role: 'Waste Collector · Chennai',
    quote: 'I usually ignore small problems until they become serious because going to the clinic means losing work.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Daily 20-second check-in',
    desc: 'Rate your day, pain, energy, and flow via WhatsApp or this app. No medical data required.',
    icon: '📱',
  },
  {
    step: '02',
    title: 'AI learns your pattern',
    desc: 'Our logistic regression model builds a personalized disruption profile from your cycle history.',
    icon: '🧠',
  },
  {
    step: '03',
    title: 'Predictions 1–3 days ahead',
    desc: 'Get LOW / MEDIUM / HIGH risk alerts so you can prepare early — not react after pain starts.',
    icon: '📊',
  },
  {
    step: '04',
    title: 'Human support when needed',
    desc: 'Community health workers step in for severe or unusual symptoms. AI never replaces humans.',
    icon: '👩‍⚕️',
  },
];

const DIFFERENTIATORS = [
  { label: 'Existing trackers', value: 'Generic cycle tracking', icon: '📅' },
  { label: 'KaamSakhi', value: 'Work-disruption prediction for daily-wage workers', icon: '🌸', highlight: true },
];

export default function HomePage() {
  return (
    <div className={styles.home}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={`tag animate-fade-up`} style={{ animationDelay: '0ms' }}>
              🌸 AI-Powered · Not a diagnostic tool
            </div>
            <h1 className={`${styles.heroTitle} animate-fade-up`} style={{ animationDelay: '80ms' }}>
              Know your{' '}
              <span className="text-gradient">difficult days.</span>
              <br />
              Plan your work.
            </h1>
            <p className={`${styles.heroSub} animate-fade-up`} style={{ animationDelay: '160ms' }}>
              KaamSakhi uses a simple AI model to predict potential menstrual work-disruption days
              for women informal workers — helping them prepare early and connect to human support.
            </p>
            <div className={`${styles.heroCtas} animate-fade-up`} style={{ animationDelay: '240ms' }}>
              <Link href="/checkin" className="btn btn-primary btn-lg" id="hero-checkin-btn">
                Start Daily Check-in
              </Link>
              <Link href="/dashboard" className="btn btn-secondary btn-lg" id="hero-dashboard-btn">
                View Dashboard
              </Link>
            </div>
            <p className={styles.heroDisclaimer}>
              ⚠️ Not a medical diagnostic tool. Always consult a healthcare professional for medical concerns.
            </p>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className={styles.statsStrip}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <div key={i} className={styles.statItem}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionTag}>The Problem</div>
          <h2 className={styles.sectionTitle}>
            Informal women workers lack a simple way to
            <span className="text-gradient"> anticipate difficult days</span>
          </h2>
          <p className={styles.sectionDesc}>
            Women informal workers often continue working through predictable menstrual symptoms because they
            cannot easily anticipate difficult days, take breaks, or access timely health support — leading to
            avoidable discomfort and work disruption.
          </p>

          <div className={`grid grid-2 ${styles.personasGrid}`}>
            {PERSONAS.map((p, i) => (
              <div key={i} className={`card ${styles.personaCard}`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className={styles.personaHeader}>
                  <div className={styles.personaEmoji}>{p.emoji}</div>
                  <div>
                    <div className={styles.personaName}>{p.name}</div>
                    <div className={styles.personaRole}>{p.role}</div>
                  </div>
                </div>
                <blockquote className={styles.personaQuote}>"{p.quote}"</blockquote>
                <p className={styles.personaNote}>
                  * Illustrative persona statement — interview hypothesis to be validated with real field interviews
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionTag}>How It Works</div>
          <h2 className={styles.sectionTitle}>
            Rules → Data → ML → Personalization
          </h2>
          <p className={styles.sectionDesc}>
            Cold start uses rule-based predictions. As you log more check-ins, the model becomes
            increasingly personalized to your actual cycle pattern.
          </p>

          <div className={`grid grid-4 ${styles.stepsGrid}`}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className={`card ${styles.stepCard}`}>
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ML SECTION */}
      <section className={styles.section}>
        <div className="container">
          <div className={`grid grid-2 ${styles.mlGrid}`}>
            <div>
              <div className={styles.sectionTag}>The AI Model</div>
              <h2 className={styles.sectionTitle}>Logistic Regression — Interpretable by Design</h2>
              <p className={styles.sectionDesc}>
                We deliberately chose a simple, explainable model over a black box. Every prediction
                can be traced back to specific input features.
              </p>
              <div className={styles.featureList}>
                {[
                  ['Cycle day', 'Where you are in your cycle'],
                  ['Previous pain', 'Your last cycle symptom pattern'],
                  ['Current fatigue', 'Real-time signal from today\'s check-in'],
                  ['Sleep quality', 'Inverse predictor — rest reduces risk'],
                  ['Workload', 'Heavy work amplifies disruption likelihood'],
                  ['Flow level', 'Correlated with symptom intensity'],
                  ['Past disruption', 'Strongest predictor — patterns repeat'],
                ].map(([feat, desc]) => (
                  <div key={feat} className={styles.featureItem}>
                    <span className={styles.featureDot} />
                    <div>
                      <strong>{feat}</strong>
                      <span className={styles.featureDesc}> — {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.mlVisual}>
              <div className={styles.mlCard}>
                <div className={styles.mlCardLabel}>Sample Prediction</div>
                <div className={styles.mlInputs}>
                  {[
                    { label: 'Cycle Day', val: '26', max: 35 },
                    { label: 'Previous Pain', val: '2.4', max: 3 },
                    { label: 'Current Fatigue', val: '2.1', max: 3 },
                    { label: 'Sleep Quality', val: '1.2', max: 3 },
                  ].map(({ label, val, max }) => (
                    <div key={label} className={styles.mlInputRow}>
                      <span className={styles.mlInputLabel}>{label}</span>
                      <div className={styles.mlBar}>
                        <div
                          className={styles.mlBarFill}
                          style={{ width: `${(parseFloat(val) / max) * 100}%` }}
                        />
                      </div>
                      <span className={styles.mlInputVal}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.mlOutput}>
                  <div className={styles.mlProb}>P(disruption) = 0.78</div>
                  <div className={`risk-badge HIGH ${styles.mlRisk}`}>HIGH RISK</div>
                  <p className={styles.mlMsg}>
                    🔴 Prepare early — keep supplies ready and consider contacting a health worker if symptoms are severe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B2B2C MODEL */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionTag}>Business Model</div>
          <h2 className={styles.sectionTitle}>B2B2C — Organizations pay, workers use free</h2>
          <div className={styles.b2b2cFlow}>
            {['NGO / Worker Cooperative', 'pays KaamSakhi', 'Women informal workers', 'use service for free'].map((item, i) => (
              <div key={i} className={i % 2 === 1 ? styles.flowArrow : styles.flowBox}>
                {i % 2 === 1 ? '↓' : item}
              </div>
            ))}
          </div>
          <div className={`grid grid-3 ${styles.pricingGrid}`}>
            {[
              { plan: 'Basic', price: '₹10', unit: '/active worker/month', features: ['WhatsApp check-in', 'AI prediction', 'Basic reminders', 'Monthly report'] },
              { plan: 'Pilot', price: '₹25,000–50,000', unit: '/organization/pilot', features: ['500+ workers', '12-week duration', 'Health worker support', 'Org dashboard', 'Impact report'], highlight: true },
              { plan: 'Standard', price: 'Custom', unit: 'for large orgs', features: ['Unlimited workers', 'API access', 'Custom reports', 'Dedicated support', 'White-label option'] },
            ].map((p, i) => (
              <div key={i} className={`card ${styles.pricingCard} ${p.highlight ? 'card-glow' : ''}`}>
                {p.highlight && <div className={styles.pricingPopular}>Recommended</div>}
                <div className={styles.pricingPlan}>{p.plan}</div>
                <div className={styles.pricingPrice}>{p.price}</div>
                <div className={styles.pricingUnit}>{p.unit}</div>
                <ul className={styles.pricingFeatures}>
                  {p.features.map(f => (
                    <li key={f}><span>✓</span> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <h2 className={styles.ctaTitle}>Ready to explore KaamSakhi?</h2>
            <p className={styles.ctaSub}>
              Seed 9,000 realistic data points, run predictions, and explore the dashboard.
            </p>
            <div className={styles.ctaBtns}>
              <Link href="/dashboard" className="btn btn-primary btn-lg" id="cta-dashboard">
                Open Dashboard
              </Link>
              <Link href="/checkin" className="btn btn-secondary btn-lg" id="cta-checkin">
                Try Check-in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
