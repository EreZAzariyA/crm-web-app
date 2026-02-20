import { Schema, models, model, Document, Types } from 'mongoose'

export interface ITeamMember {
  userId: Types.ObjectId
  role: 'lead' | 'member'
}

export interface ITeam extends Document {
  name: string
  description: string
  members: ITeamMember[]
  createdBy: Types.ObjectId
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['lead', 'member'], default: 'member' },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default models.Team || model<ITeam>('Team', TeamSchema)
