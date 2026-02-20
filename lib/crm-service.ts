import { apiClient } from '@/lib/api-client/client'
import type { Stage } from '@/lib/engines/deal-lifecycle'
import type { RiskScoreResult } from '@/lib/engines/risk-scoring'
import type { ExtractedFinancialData } from '@/lib/models/Document'

export type { Stage }
export type { RiskScoreResult }
export type { ExtractedFinancialData }

export type Contact = {
  id: string
  name: string
  email: string
  company: string
  role: string
  status: 'lead' | 'prospect' | 'customer' | 'churned'
  phone: string
  lastActivity: string
  avatar: string
}

export type Deal = {
  id: string
  title: string
  company: string
  value: number                // Loan amount requested
  stage: Stage
  probability: number          // Repayment probability 0–100
  contact: string              // Primary borrower name
  expectedClose: string        // Expected disbursement date
  notes: string
  lostReason?: string           // Decline / default reason

  // Lending-specific (optional — null if not set)
  interestRate?: number | null
  loanTerm?: number | null
  ltvRatio?: number | null
  dtiRatio?: number | null
  creditScore?: number | null
  riskRating?: 'A' | 'B' | 'C' | 'D' | null
  approvedAmount?: number | null
  disbursementDate?: string | null
  maturityDate?: string | null
  originationFee?: number | null
  collateralValue?: number | null
  underwriterId?: string | null

  // Audit trail
  stageHistory?: Array<{
    stage:     string
    changedAt: string
    changedBy: string
  }>
}

export type Activity = {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note'
  title: string
  contact: string
  time: string
  description: string
}

export type DocumentRecord = {
  id:            string
  dealId:        string
  filename:      string
  originalName:  string
  mimeType:      string
  size:          number        // bytes
  uploadedAt:    string
  extractedData: ExtractedFinancialData | null
  status:        'pending' | 'processing' | 'done' | 'failed'
  errorMessage:  string | null
}

export const CrmService = {
  getContacts: () => apiClient.get<Contact[]>('/contacts'),
  getDeals: () => apiClient.get<Deal[]>('/deals'),
  getActivities: () => apiClient.get<Activity[]>('/activities'),

  createContact: (contact: Omit<Contact, 'id' | 'lastActivity' | 'avatar'>) =>
    apiClient.post<Contact>('/contacts', contact),

  updateContact: (id: string, updates: Partial<Contact>) =>
    apiClient.put<Contact>(`/contacts/${id}`, updates),

  deleteContact: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/contacts/${id}`),

  createDeal: (deal: Omit<Deal, 'id'>) =>
    apiClient.post<Deal>('/deals', deal),

  updateDeal: (id: string, updates: Partial<Deal>) =>
    apiClient.put<Deal>(`/deals/${id}`, updates),

  deleteDeal: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/deals/${id}`),

  rescoreDeal: (id: string) =>
    apiClient.post<RiskScoreResult>(`/deals/${id}/score`, {}),

  getDocuments: (dealId: string) =>
    apiClient.get<DocumentRecord[]>(`/deals/${dealId}/documents`),

  uploadDocument: (dealId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.upload<DocumentRecord>(`/deals/${dealId}/documents`, fd)
  },

  deleteDocument: (dealId: string, docId: string) =>
    apiClient.delete<{ success: boolean }>(`/deals/${dealId}/documents/${docId}`),

  createActivity: (activity: Omit<Activity, 'id' | 'time'>) =>
    apiClient.post<Activity>('/activities', activity),

  deleteActivity: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/activities/${id}`),
}
