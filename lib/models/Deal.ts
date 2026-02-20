import { Schema, models, model, Document, Types } from 'mongoose'
import type { Stage } from '@/lib/engines/deal-lifecycle'

export type { Stage }

export interface IStageHistoryEntry {
  stage: string
  changedAt: Date
  changedBy: Types.ObjectId
}

export interface IDeal extends Document {
  userId: Types.ObjectId
  teamId: Types.ObjectId | null

  // ── Core fields (unchanged) ──────────────────────────────────────────────
  title: string
  company: string
  value: number              // Loan amount requested
  stage: Stage
  probability: number        // Repayment probability 0–100
  contact: string            // Primary borrower name
  expectedClose: string      // Expected disbursement date
  notes: string
  lostReason: string         // Decline / default / withdrawal reason

  // ── Lending-specific fields (all optional) ───────────────────────────────
  interestRate: number | null       // Annual interest rate %
  loanTerm: number | null           // Loan term in months
  ltvRatio: number | null           // Loan-to-Value ratio %
  dtiRatio: number | null           // Debt-to-Income ratio %
  creditScore: number | null        // Borrower credit score (300–850)
  riskRating: 'A' | 'B' | 'C' | 'D' | null
  approvedAmount: number | null     // Final approved amount (may differ from value)
  disbursementDate: string | null
  maturityDate: string | null
  originationFee: number | null     // % of loan amount
  collateralValue: number | null
  underwriterId: Types.ObjectId | null  // ref: User

  // ── Audit trail ──────────────────────────────────────────────────────────
  stageHistory: IStageHistoryEntry[]
}

const StageHistorySchema = new Schema<IStageHistoryEntry>(
  {
    stage:     { type: String, required: true },
    changedAt: { type: Date,   required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
)

const LENDING_STAGES: Stage[] = [
  'lead',
  'pre_qualification',
  'underwriting',
  'approved',
  'active',
  'monitoring',
  'collection',
  'closed_won',
  'closed_lost',
  'default',
]

const DealSchema = new Schema<IDeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },

    // ── Core fields ──
    title:         { type: String, required: true, trim: true },
    company:       { type: String, default: '' },
    value:         { type: Number, required: true, default: 0 },
    stage:         { type: String, enum: LENDING_STAGES, default: 'lead' },
    probability:   { type: Number, default: 0, min: 0, max: 100 },
    contact:       { type: String, default: '' },
    expectedClose: { type: String, default: '' },
    notes:         { type: String, default: '' },
    lostReason:    { type: String, default: '' },

    // ── Lending fields ──
    interestRate:     { type: Number, default: null },
    loanTerm:         { type: Number, default: null },
    ltvRatio:         { type: Number, default: null },
    dtiRatio:         { type: Number, default: null },
    creditScore:      { type: Number, default: null, min: 300, max: 850 },
    riskRating:       { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
    approvedAmount:   { type: Number, default: null },
    disbursementDate: { type: String, default: null },
    maturityDate:     { type: String, default: null },
    originationFee:   { type: Number, default: null },
    collateralValue:  { type: Number, default: null },
    underwriterId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Audit trail ──
    stageHistory: { type: [StageHistorySchema], default: [] },
  },
  { timestamps: true }
)

export default models.Deal || model<IDeal>('Deal', DealSchema)
