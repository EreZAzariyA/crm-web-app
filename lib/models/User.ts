import mongoose, { Schema, models, model, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  hashedPassword: string | null
  firstName: string
  lastName: string
  phone: string
  company: string
  role: string
  location: string
  bio: string
  // OAuth fields
  oauthProvider: 'google' | 'github' | null
  oauthId: string | null
  avatar: string | null
  notifications: {
    email: boolean
    push: boolean
    dealUpdates: boolean
    contactUpdates: boolean
    activityAlerts: boolean
    weeklyReport: boolean
  }
  appearance: {
    language: string
    timezone: string
    dateFormat: string
  }
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, default: null },
    oauthProvider: { type: String, enum: ['google', 'github', null], default: null },
    oauthId: { type: String, default: null },
    avatar: { type: String, default: null },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      dealUpdates: { type: Boolean, default: true },
      contactUpdates: { type: Boolean, default: false },
      activityAlerts: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
    },
    appearance: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'pst' },
      dateFormat: { type: String, default: 'mdy' },
    },
  },
  { timestamps: true }
)

export default models.User || model<IUser>('User', UserSchema)
