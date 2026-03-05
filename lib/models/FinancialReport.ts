import { Schema, models, model, Document, Types } from 'mongoose'

export interface ITransaction {
  date:        string
  category:    string
  type:        'income' | 'expense'
  description: string
  amount:      number
  currency:    string
}

export interface IMetric {
  name:   string
  value:  string
  impact: 'positive' | 'neutral' | 'negative'
}

export interface IExpenseBreakdown {
  category:   string
  amount:     number
  percentage: number
}

export interface IFinancialSummary {
  totalRevenue:       number
  totalExpenses:      number
  netCashFlow:        number
  debtRatio:          number
  profitabilityRatio: number
  expenseBreakdown:   IExpenseBreakdown[]
}

export interface IFinancialReport extends Document {
  companyName:      string
  userId:           Types.ObjectId
  originalName:     string
  transactions:     ITransaction[]
  summary:          IFinancialSummary | null
  creditScore:      number | null           // 0-100
  creditRating:     string | null           // "Excellent" | "Good" | "Fair" | "Poor"
  scoreExplanation: string | null
  metrics:          IMetric[]
  status:           'processing' | 'done' | 'failed'
  errorMessage:     string | null
  createdAt:        Date
  updatedAt:        Date
}

const TransactionSchema = new Schema<ITransaction>({
  date:        { type: String, default: '' },
  category:    { type: String, default: '' },
  type:        { type: String, enum: ['income', 'expense'], default: 'expense' },
  description: { type: String, default: '' },
  amount:      { type: Number, default: 0 },
  currency:    { type: String, default: 'USD' },
}, { _id: false })

const MetricSchema = new Schema<IMetric>({
  name:   { type: String, required: true },
  value:  { type: String, required: true },
  impact: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
}, { _id: false })

const ExpenseBreakdownSchema = new Schema<IExpenseBreakdown>({
  category:   { type: String, required: true },
  amount:     { type: Number, required: true },
  percentage: { type: Number, required: true },
}, { _id: false })

const SummarySchema = new Schema<IFinancialSummary>({
  totalRevenue:       { type: Number, default: 0 },
  totalExpenses:      { type: Number, default: 0 },
  netCashFlow:        { type: Number, default: 0 },
  debtRatio:          { type: Number, default: 0 },
  profitabilityRatio: { type: Number, default: 0 },
  expenseBreakdown:   { type: [ExpenseBreakdownSchema], default: [] },
}, { _id: false })

const FinancialReportSchema = new Schema<IFinancialReport>({
  companyName:      { type: String, required: true, index: true },
  userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
  originalName:     { type: String, required: true },
  transactions:     { type: [TransactionSchema], default: [] },
  summary:          { type: SummarySchema, default: null },
  creditScore:      { type: Number, default: null },
  creditRating:     { type: String, default: null },
  scoreExplanation: { type: String, default: null },
  metrics:          { type: [MetricSchema], default: [] },
  status:           { type: String, enum: ['processing', 'done', 'failed'], default: 'processing' },
  errorMessage:     { type: String, default: null },
}, { timestamps: true })

export default models.FinancialReport || model<IFinancialReport>('FinancialReport', FinancialReportSchema)
