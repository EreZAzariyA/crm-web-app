export type Contact = {
  id: string
  name: string
  email: string
  company: string
  role: string
  status: "lead" | "prospect" | "customer" | "churned"
  phone: string
  lastActivity: string
  avatar: string
}

export type Deal = {
  id: string
  title: string
  company: string
  value: number
  stage: "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  probability: number
  contact: string
  expectedClose: string
}

export type Activity = {
  id: string
  type: "email" | "call" | "meeting" | "note"
  title: string
  contact: string
  time: string
  description: string
}

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@acmecorp.com",
    company: "Acme Corp",
    role: "VP of Engineering",
    status: "customer",
    phone: "+1 (415) 555-0123",
    lastActivity: "2 hours ago",
    avatar: "SC",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    email: "m.johnson@techflow.io",
    company: "TechFlow",
    role: "CTO",
    status: "prospect",
    phone: "+1 (628) 555-0456",
    lastActivity: "5 hours ago",
    avatar: "MJ",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@designhub.co",
    company: "DesignHub",
    role: "Head of Product",
    status: "lead",
    phone: "+1 (510) 555-0789",
    lastActivity: "1 day ago",
    avatar: "ER",
  },
  {
    id: "4",
    name: "David Kim",
    email: "dkim@cloudnine.dev",
    company: "CloudNine",
    role: "CEO",
    status: "customer",
    phone: "+1 (925) 555-0321",
    lastActivity: "3 hours ago",
    avatar: "DK",
  },
  {
    id: "5",
    name: "Olivia Thompson",
    email: "olivia@growthly.com",
    company: "Growthly",
    role: "Director of Sales",
    status: "prospect",
    phone: "+1 (408) 555-0654",
    lastActivity: "6 hours ago",
    avatar: "OT",
  },
  {
    id: "6",
    name: "James Lee",
    email: "james.lee@novatech.ai",
    company: "NovaTech",
    role: "VP of Sales",
    status: "lead",
    phone: "+1 (650) 555-0987",
    lastActivity: "2 days ago",
    avatar: "JL",
  },
  {
    id: "7",
    name: "Anna Weber",
    email: "a.weber@financeplus.com",
    company: "FinancePlus",
    role: "CFO",
    status: "customer",
    phone: "+1 (212) 555-0147",
    lastActivity: "1 hour ago",
    avatar: "AW",
  },
  {
    id: "8",
    name: "Ryan Patel",
    email: "rpatel@startuphq.io",
    company: "StartupHQ",
    role: "Founder",
    status: "churned",
    phone: "+1 (312) 555-0258",
    lastActivity: "1 week ago",
    avatar: "RP",
  },
]

export const deals: Deal[] = [
  {
    id: "1",
    title: "Enterprise Platform License",
    company: "Acme Corp",
    value: 125000,
    stage: "closed-won",
    probability: 100,
    contact: "Sarah Chen",
    expectedClose: "Jan 15, 2026",
  },
  {
    id: "2",
    title: "Annual SaaS Subscription",
    company: "TechFlow",
    value: 48000,
    stage: "proposal",
    probability: 50,
    contact: "Marcus Johnson",
    expectedClose: "Apr 1, 2026",
  },
  {
    id: "3",
    title: "Design Tool Integration",
    company: "DesignHub",
    value: 32000,
    stage: "discovery",
    probability: 25,
    contact: "Emily Rodriguez",
    expectedClose: "May 20, 2026",
  },
  {
    id: "4",
    title: "Cloud Infrastructure Deal",
    company: "CloudNine",
    value: 210000,
    stage: "closed-won",
    probability: 100,
    contact: "David Kim",
    expectedClose: "Feb 10, 2026",
  },
  {
    id: "5",
    title: "Sales Automation Suite",
    company: "Growthly",
    value: 67000,
    stage: "closed-won",
    probability: 100,
    contact: "Olivia Thompson",
    expectedClose: "Mar 28, 2026",
  },
  {
    id: "6",
    title: "AI Analytics Package",
    company: "NovaTech",
    value: 89000,
    stage: "discovery",
    probability: 20,
    contact: "James Lee",
    expectedClose: "Jun 15, 2026",
  },
  {
    id: "7",
    title: "Financial Reporting Module",
    company: "FinancePlus",
    value: 156000,
    stage: "closed-won",
    probability: 100,
    contact: "Anna Weber",
    expectedClose: "Dec 15, 2025",
  },
  {
    id: "8",
    title: "Startup Growth Bundle",
    company: "StartupHQ",
    value: 15000,
    stage: "closed-lost",
    probability: 0,
    contact: "Ryan Patel",
    expectedClose: "Jan 30, 2026",
  },
]

export const activities: Activity[] = [
  {
    id: "1",
    type: "email",
    title: "Sent proposal to Sarah Chen",
    contact: "Sarah Chen",
    time: "2 hours ago",
    description: "Sent the updated enterprise pricing proposal with volume discounts.",
  },
  {
    id: "2",
    type: "call",
    title: "Discovery call with Marcus Johnson",
    contact: "Marcus Johnson",
    time: "5 hours ago",
    description: "Discussed technical requirements and integration timeline for TechFlow.",
  },
  {
    id: "3",
    type: "meeting",
    title: "Demo with DesignHub team",
    contact: "Emily Rodriguez",
    time: "1 day ago",
    description: "Walked through the design tool integration features and roadmap.",
  },
  {
    id: "4",
    type: "note",
    title: "Updated deal notes for CloudNine",
    contact: "David Kim",
    time: "3 hours ago",
    description: "Contract signed. Implementation begins next month.",
  },
  {
    id: "5",
    type: "email",
    title: "Follow-up with Olivia Thompson",
    contact: "Olivia Thompson",
    time: "6 hours ago",
    description: "Sent case studies and ROI calculator for the sales automation suite.",
  },
  {
    id: "6",
    type: "call",
    title: "Negotiation call with Anna Weber",
    contact: "Anna Weber",
    time: "1 hour ago",
    description: "Final pricing discussion for the financial reporting module.",
  },
]

export const revenueData = [
  { month: "Sep", revenue: 32000, deals: 4 },
  { month: "Oct", revenue: 45000, deals: 6 },
  { month: "Nov", revenue: 38000, deals: 5 },
  { month: "Dec", revenue: 52000, deals: 7 },
  { month: "Jan", revenue: 61000, deals: 8 },
  { month: "Feb", revenue: 78000, deals: 10 },
]

export const pipelineData = [
  { stage: "Discovery", value: 121000, count: 2 },
  { stage: "Proposal", value: 115000, count: 2 },
  { stage: "Negotiation", value: 281000, count: 2 },
  { stage: "Closed Won", value: 210000, count: 1 },
]
