/**
 * Risk Scoring Engine
 *
 * Pure TypeScript — no framework imports. Runs isomorphically in:
 *  - API routes (auto-score on save)
 *  - React components (instant client-side preview)
 */

export type RiskRating = 'A' | 'B' | 'C' | 'D'

export interface MetricScore {
  value: number | null
  score: number   // 0–100 component score
  tier: 'excellent' | 'good' | 'fair' | 'poor' | 'unscored'
  label: string   // human-readable, e.g. "720 · Good"
}

export interface RiskBreakdown {
  creditScore: MetricScore
  ltv:         MetricScore
  dti:         MetricScore
  loanTerm:    MetricScore
  loanAmount:  MetricScore
}

export interface RiskScoreResult {
  score:         number      // 0–100 composite
  rating:        RiskRating  // A / B / C / D
  breakdown:     RiskBreakdown
  hasEnoughData: boolean     // false when fewer than 2 inputs are non-null
}

export interface RiskInputs {
  creditScore:    number | null
  ltvRatio:       number | null
  dtiRatio:       number | null
  loanTerm:       number | null
  value:          number          // loan amount requested
  approvedAmount: number | null
}

// Weights — must conceptually sum to 1.0 (re-normalised at runtime for missing metrics)
const WEIGHTS = {
  creditScore: 0.35,
  ltv:         0.25,
  dti:         0.25,
  loanTerm:    0.10,
  loanAmount:  0.05,
} as const

// ── Scoring helpers ───────────────────────────────────────────────────────────

/** Linear interpolation clamped to [min, max] */
function lerp(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x <= x0) return y0
  if (x >= x1) return y1
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
}

function tierLabel(tier: MetricScore['tier'], value: number | null, unit = ''): string {
  if (tier === 'unscored' || value === null) return '—'
  const labels: Record<MetricScore['tier'], string> = {
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
    poor:      'Poor',
    unscored:  '—',
  }
  return `${value}${unit} · ${labels[tier]}`
}

function toTier(score: number): MetricScore['tier'] {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 45) return 'fair'
  return 'poor'
}

// ── Per-metric scorers ────────────────────────────────────────────────────────

function scoreCreditScore(v: number | null): MetricScore {
  if (v === null) return { value: null, score: 0, tier: 'unscored', label: '—' }
  let score: number
  if (v >= 750)      score = lerp(v, 750, 850, 90, 100)
  else if (v >= 700) score = lerp(v, 700, 749, 70, 89)
  else if (v >= 650) score = lerp(v, 650, 699, 45, 69)
  else               score = lerp(v, 300, 649, 0,  44)
  score = Math.round(score)
  const tier = toTier(score)
  return { value: v, score, tier, label: tierLabel(tier, v) }
}

function scoreLtv(v: number | null): MetricScore {
  if (v === null) return { value: null, score: 0, tier: 'unscored', label: '—' }
  // Lower LTV = less risk; thresholds are upper bounds
  let score: number
  if (v < 60)      score = lerp(v, 0,  59,  100, 91)
  else if (v < 75) score = lerp(v, 60, 74,  89, 70)
  else if (v < 85) score = lerp(v, 75, 84,  69, 45)
  else             score = lerp(v, 85, 100, 44, 0)
  score = Math.round(score)
  const tier = toTier(score)
  return { value: v, score, tier, label: tierLabel(tier, v, '%') }
}

function scoreDti(v: number | null): MetricScore {
  if (v === null) return { value: null, score: 0, tier: 'unscored', label: '—' }
  // Lower DTI = less risk
  let score: number
  if (v < 28)      score = lerp(v, 0,  27,  100, 91)
  else if (v < 36) score = lerp(v, 28, 35,  89, 70)
  else if (v < 43) score = lerp(v, 36, 42,  69, 45)
  else             score = lerp(v, 43, 80,  44, 0)
  score = Math.round(score)
  const tier = toTier(score)
  return { value: v, score, tier, label: tierLabel(tier, v, '%') }
}

function scoreLoanTerm(v: number | null): MetricScore {
  if (v === null) return { value: null, score: 0, tier: 'unscored', label: '—' }
  // Shorter term = less risk; anchors in months
  let score: number
  if (v <= 12)       score = 100
  else if (v <= 24)  score = lerp(v, 12, 24,  100, 85)
  else if (v <= 36)  score = lerp(v, 24, 36,  85,  70)
  else if (v <= 60)  score = lerp(v, 36, 60,  70,  55)
  else if (v <= 120) score = lerp(v, 60, 120, 55,  35)
  else               score = lerp(v, 120, 360, 35,  5)
  score = Math.round(score)
  const tier = toTier(score)
  return { value: v, score, tier, label: tierLabel(tier, v, ' mo') }
}

function scoreLoanAmount(value: number, approvedAmount: number | null): MetricScore {
  if (approvedAmount === null || value === 0) {
    // Neutral score when no approved amount yet
    return { value: null, score: 50, tier: 'fair', label: 'Pending approval' }
  }
  const ratio = approvedAmount / value
  let score: number
  if (ratio >= 0.95)      score = lerp(ratio, 0.95, 1.0, 90, 100)
  else if (ratio >= 0.80) score = lerp(ratio, 0.80, 0.95, 70, 89)
  else if (ratio >= 0.60) score = lerp(ratio, 0.60, 0.80, 45, 69)
  else                    score = lerp(ratio, 0.00, 0.60, 0,  44)
  score = Math.round(score)
  const tier = toTier(score)
  return { value: approvedAmount, score, tier, label: `${Math.round(ratio * 100)}% approved` }
}

// ── Composite scorer ──────────────────────────────────────────────────────────

function compositeToRating(score: number): RiskRating {
  if (score >= 75) return 'A'
  if (score >= 55) return 'B'
  if (score >= 35) return 'C'
  return 'D'
}

export function computeRiskScore(inputs: RiskInputs): RiskScoreResult {
  const breakdown: RiskBreakdown = {
    creditScore: scoreCreditScore(inputs.creditScore),
    ltv:         scoreLtv(inputs.ltvRatio),
    dti:         scoreDti(inputs.dtiRatio),
    loanTerm:    scoreLoanTerm(inputs.loanTerm),
    loanAmount:  scoreLoanAmount(inputs.value, inputs.approvedAmount),
  }

  // Re-normalise weights — only count metrics with real data (not unscored)
  const entries = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[])
  let totalWeight = 0
  let weightedSum = 0
  let presentCount = 0

  for (const key of entries) {
    const metric = breakdown[key]
    if (metric.tier !== 'unscored') {
      const w = WEIGHTS[key]
      weightedSum += metric.score * w
      totalWeight += w
      presentCount++
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  const rating = compositeToRating(score)

  return {
    score,
    rating,
    breakdown,
    hasEnoughData: presentCount >= 2,
  }
}

// ── Rating metadata (UI helpers) ──────────────────────────────────────────────

export const RATING_LABELS: Record<RiskRating, string> = {
  A: 'Low Risk',
  B: 'Moderate Risk',
  C: 'Elevated Risk',
  D: 'High Risk',
}

export const RATING_COLORS: Record<RiskRating, string> = {
  A: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  B: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  C: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  D: 'bg-red-500/15 text-red-600 border-red-500/30',
}

export const TIER_COLORS: Record<MetricScore['tier'], string> = {
  excellent: 'bg-emerald-500',
  good:      'bg-blue-500',
  fair:      'bg-amber-500',
  poor:      'bg-red-500',
  unscored:  'bg-muted',
}
