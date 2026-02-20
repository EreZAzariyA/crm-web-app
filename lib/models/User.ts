import mongoose, { Schema, models, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  email: string
  hashedPassword: string
  firstName: string
  lastName: string
  phone: string
  company: string
  role: string                              // job title (free text)
  systemRole: 'admin' | 'manager' | 'user' // access control role
  isActive: boolean
  location: string
  bio: string
  teamId: Types.ObjectId | null
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
    theme: 'light' | 'dark' | 'system'
    sidebarCollapsed: boolean
    timezone: string
    dateFormat: string
  }
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, required: true },
    avatar: { type: String, default: null },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    systemRole: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
    },
    isActive: { type: Boolean, default: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
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
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      sidebarCollapsed: { type: Boolean, default: false },
      timezone: { type: String, default: 'pst' },
      dateFormat: { type: String, default: 'mdy' },
    },
  },
  { timestamps: true }
)

export default models.User || model<IUser>('User', UserSchema)
