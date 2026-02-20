import { apiClient } from '@/lib/api-client/client'

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
  value: number
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  contact: string
  expectedClose: string
  notes: string
  lostReason: string
}

export type Activity = {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note'
  title: string
  contact: string
  time: string
  description: string
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

  createActivity: (activity: Omit<Activity, 'id' | 'time'>) =>
    apiClient.post<Activity>('/activities', activity),

  deleteActivity: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/activities/${id}`),
}
