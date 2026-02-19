import {
  contacts as initialContacts,
  deals as initialDeals,
  activities as initialActivities,
  type Contact,
  type Deal,
  type Activity,
} from "./crm-data"

export type { Contact, Deal, Activity }

// Simulating API latency (random between 500ms and 1500ms)
const delay = (ms?: number) =>
  new Promise((resolve) => setTimeout(resolve, ms || 500 + Math.random() * 1000))

export const CrmService = {
  getContacts: async (): Promise<Contact[]> => {
    await delay()
    return [...initialContacts]
  },

  getDeals: async (): Promise<Deal[]> => {
    await delay()
    return [...initialDeals]
  },

  getActivities: async (): Promise<Activity[]> => {
    await delay()
    return [...initialActivities]
  },

  createContact: async (contact: Omit<Contact, "id" | "lastActivity" | "avatar">): Promise<Contact> => {
    await delay(1000)
    const newContact: Contact = {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
      lastActivity: "Just now",
      avatar: contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    }
    // In a real app, this would be a POST request
    // For now, we return the object so the store can add it
    return newContact
  },

  updateContact: async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    await delay(800)
    // Mock response
    return {
      ...initialContacts[0], // Fallback for type safety in mock
      ...updates,
      id,
    } as Contact
  },

  deleteContact: async (id: string): Promise<void> => {
    await delay(600)
    // Mock success
  },
}
