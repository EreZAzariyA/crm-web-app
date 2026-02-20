import { Schema, models, model, Document, Types } from 'mongoose'

export interface IContact extends Document {
  userId: Types.ObjectId
  name: string
  email: string
  company: string
  role: string
  status: 'lead' | 'prospect' | 'customer' | 'churned'
  phone: string
  lastActivity: string
  avatar: string
}

const ContactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    status: {
      type: String,
      enum: ['lead', 'prospect', 'customer', 'churned'],
      default: 'lead',
    },
    phone: { type: String, default: '' },
    lastActivity: { type: String, default: 'Just now' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
)

export default models.Contact || model<IContact>('Contact', ContactSchema)
