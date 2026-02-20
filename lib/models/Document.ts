import { Schema, models, model, Document, Types } from 'mongoose'

export interface ExtractedFinancialData {
  monthlyRevenue:        number | null
  totalRevenue:          number | null
  monthlyExpenses:       number | null
  monthlyDebtObligations: number | null
  accountBalance:        number | null
  suggestedDtiRatio:     number | null   // (monthlyDebt / monthlyRevenue) * 100
  suggestedMaxLoan:      number | null   // monthlyRevenue * 36
  rawLines:              string[]        // up to 20 lines containing $ amounts (PDF only)
}

export interface IDocument extends Document {
  dealId:        Types.ObjectId
  userId:        Types.ObjectId
  filename:      string        // stored filename on disk
  originalName:  string        // original upload name
  mimeType:      string
  size:          number        // bytes
  uploadedAt:    Date
  extractedData: ExtractedFinancialData | null
  status:        'pending' | 'processing' | 'done' | 'failed'
  errorMessage:  string | null
}

const ExtractedSchema = new Schema<ExtractedFinancialData>({
  monthlyRevenue:         { type: Number, default: null },
  totalRevenue:           { type: Number, default: null },
  monthlyExpenses:        { type: Number, default: null },
  monthlyDebtObligations: { type: Number, default: null },
  accountBalance:         { type: Number, default: null },
  suggestedDtiRatio:      { type: Number, default: null },
  suggestedMaxLoan:       { type: Number, default: null },
  rawLines:               { type: [String], default: [] },
}, { _id: false })

const DocumentSchema = new Schema<IDocument>({
  dealId:        { type: Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filename:      { type: String, required: true },
  originalName:  { type: String, required: true },
  mimeType:      { type: String, required: true },
  size:          { type: Number, required: true },
  uploadedAt:    { type: Date, default: Date.now },
  extractedData: { type: ExtractedSchema, default: null },
  status:        { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
  errorMessage:  { type: String, default: null },
}, { timestamps: true })

export default models.Document || model<IDocument>('Document', DocumentSchema)
