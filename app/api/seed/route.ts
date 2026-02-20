import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Contact from '@/lib/models/Contact'
import Deal from '@/lib/models/Deal'
import Activity from '@/lib/models/Activity'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  // Clear existing data for this user
  await Contact.deleteMany({ userId })
  await Deal.deleteMany({ userId })
  await Activity.deleteMany({ userId })

  // Seed contacts
  const contacts = await Contact.insertMany([
    { userId, name: 'Sarah Johnson',   email: 'sarah@acmecorp.com',    company: 'Acme Corp',       role: 'CEO',               status: 'customer',  phone: '+1 555-0101', avatar: 'SJ', lastActivity: '2 hours ago' },
    { userId, name: 'Michael Chen',    email: 'mchen@techcorp.io',     company: 'TechCorp',        role: 'CTO',               status: 'prospect',  phone: '+1 555-0102', avatar: 'MC', lastActivity: '1 day ago' },
    { userId, name: 'Emily Rodriguez', email: 'emily@startupxyz.com',  company: 'StartupXYZ',      role: 'Founder',           status: 'lead',      phone: '+1 555-0103', avatar: 'ER', lastActivity: '3 days ago' },
    { userId, name: 'David Kim',       email: 'dkim@globaltech.net',   company: 'GlobalTech',      role: 'VP Sales',          status: 'customer',  phone: '+1 555-0104', avatar: 'DK', lastActivity: '5 hours ago' },
    { userId, name: 'Lisa Park',       email: 'lpark@innovate.co',     company: 'Innovate Co',     role: 'Product Manager',   status: 'prospect',  phone: '+1 555-0105', avatar: 'LP', lastActivity: '2 days ago' },
    { userId, name: 'James Wilson',    email: 'jwilson@megasoft.com',  company: 'Megasoft',        role: 'Director',          status: 'churned',   phone: '+1 555-0106', avatar: 'JW', lastActivity: '2 weeks ago' },
    { userId, name: 'Anna Martinez',   email: 'anna@brightco.com',     company: 'Bright Co',       role: 'CMO',               status: 'lead',      phone: '+1 555-0107', avatar: 'AM', lastActivity: '1 hour ago' },
    { userId, name: 'Tom Anderson',    email: 'tom@bluesky.io',        company: 'BlueSky',         role: 'Sales Manager',     status: 'prospect',  phone: '+1 555-0108', avatar: 'TA', lastActivity: '4 days ago' },
  ])

  // Seed deals
  await Deal.insertMany([
    { userId, title: 'Acme Corp Enterprise Plan',   company: 'Acme Corp',    value: 48000, stage: 'closed-won',  probability: 100, contact: contacts[0].name, expectedClose: '2025-12-31' },
    { userId, title: 'TechCorp Platform License',   company: 'TechCorp',     value: 32000, stage: 'negotiation', probability: 75,  contact: contacts[1].name, expectedClose: '2026-02-28' },
    { userId, title: 'StartupXYZ Starter Package',  company: 'StartupXYZ',   value: 8500,  stage: 'proposal',    probability: 50,  contact: contacts[2].name, expectedClose: '2026-03-15' },
    { userId, title: 'GlobalTech Annual Renewal',   company: 'GlobalTech',   value: 72000, stage: 'closed-won',  probability: 100, contact: contacts[3].name, expectedClose: '2025-11-30' },
    { userId, title: 'Innovate Co Pilot Program',   company: 'Innovate Co',  value: 15000, stage: 'discovery',   probability: 25,  contact: contacts[4].name, expectedClose: '2026-04-01' },
    { userId, title: 'Bright Co Growth Plan',       company: 'Bright Co',    value: 24000, stage: 'proposal',    probability: 60,  contact: contacts[6].name, expectedClose: '2026-03-01' },
    { userId, title: 'BlueSky Team License',        company: 'BlueSky',      value: 11000, stage: 'discovery',   probability: 30,  contact: contacts[7].name, expectedClose: '2026-04-15' },
  ])

  // Seed activities
  await Activity.insertMany([
    { userId, type: 'email',   title: 'Sent proposal to Sarah Johnson',       contact: 'Sarah Johnson',  time: '2 hours ago',  description: 'Sent the updated enterprise pricing proposal with volume discounts.' },
    { userId, type: 'call',    title: 'Discovery call with Michael Chen',      contact: 'Michael Chen',   time: '5 hours ago',  description: 'Discussed technical requirements and integration timeline for TechCorp.' },
    { userId, type: 'meeting', title: 'Demo with StartupXYZ team',            contact: 'Emily Rodriguez', time: '1 day ago',   description: 'Walked through the platform features and onboarding roadmap.' },
    { userId, type: 'note',    title: 'Updated deal notes for GlobalTech',     contact: 'David Kim',      time: '3 hours ago',  description: 'Contract signed. Implementation begins next month.' },
    { userId, type: 'call',    title: 'Follow-up call with Lisa Park',         contact: 'Lisa Park',      time: '2 days ago',   description: 'Reviewed pilot program results and discussed expansion options.' },
    { userId, type: 'email',   title: 'Sent onboarding docs to Bright Co',    contact: 'Anna Martinez',  time: '3 days ago',   description: 'Shared getting started guide and scheduled kickoff meeting.' },
  ])

  return NextResponse.json({
    ok: true,
    contacts: contacts.length,
    deals: 7,
    activities: 6,
  })
}
