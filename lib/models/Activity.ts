import { Schema, models, model, Document, Types } from 'mongoose'

export interface IActivity extends Document {
  userId: Types.ObjectId
  teamId: Types.ObjectId | null
  type: 'email' | 'call' | 'meeting' | 'note'
  title: string
  contact: string
  time: string
  description: string
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'note'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    contact: { type: String, default: '' },
    time: { type: String, default: 'Just now' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
)

export default models.Activity || model<IActivity>('Activity', ActivitySchema)
