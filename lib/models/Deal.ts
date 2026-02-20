import { Schema, models, model, Document, Types } from 'mongoose'

export interface IDeal extends Document {
  userId: Types.ObjectId
  title: string
  company: string
  value: number
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  contact: string
  expectedClose: string
  notes: string
  lostReason: string
}

const DealSchema = new Schema<IDeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    value: { type: Number, required: true, default: 0 },
    stage: {
      type: String,
      enum: ['discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      default: 'discovery',
    },
    probability: { type: Number, default: 0, min: 0, max: 100 },
    contact: { type: String, default: '' },
    expectedClose: { type: String, default: '' },
    notes: { type: String, default: '' },
    lostReason: { type: String, default: '' },
  },
  { timestamps: true }
)

export default models.Deal || model<IDeal>('Deal', DealSchema)
