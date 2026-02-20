import { Schema, models, model, Document, Types } from 'mongoose'

export interface IInvite extends Document {
  token: string
  email: string
  firstName: string
  lastName: string
  systemRole: 'admin' | 'manager' | 'user'
  teamId: Types.ObjectId | null
  invitedBy: Types.ObjectId
  expiresAt: Date
  usedAt: Date | null
}

const InviteSchema = new Schema<IInvite>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    systemRole: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
    },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default models.Invite || model<IInvite>('Invite', InviteSchema)
