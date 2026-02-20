/**
 * One-time migration: map old sales pipeline stages → lending lifecycle stages
 *
 * Old → New mapping:
 *   discovery   → lead
 *   proposal    → pre_qualification
 *   negotiation → underwriting
 *   closed-won  → closed_won
 *   closed-lost → closed_lost
 *
 * Safe to run multiple times (only updates docs with old stage values).
 * Admin-only. Remove this route once migration is confirmed complete.
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'

const STAGE_MAP: Record<string, string> = {
  discovery:    'lead',
  proposal:     'pre_qualification',
  negotiation:  'underwriting',
  'closed-won': 'closed_won',
  'closed-lost': 'closed_lost',
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  let totalMigrated = 0
  const results: Record<string, number> = {}

  for (const [oldStage, newStage] of Object.entries(STAGE_MAP)) {
    const { modifiedCount } = await Deal.updateMany(
      { stage: oldStage },
      {
        $set: { stage: newStage },
        // Seed a stageHistory entry for migrated docs that don't have one
        $setOnInsert: {},
      }
    )
    results[`${oldStage} → ${newStage}`] = modifiedCount
    totalMigrated += modifiedCount
  }

  // For migrated deals with empty stageHistory, seed it with the current stage
  const dealsWithoutHistory = await Deal.find({ stageHistory: { $size: 0 } }).select('_id stage')
  for (const deal of dealsWithoutHistory) {
    await Deal.updateOne(
      { _id: deal._id },
      {
        $push: {
          stageHistory: {
            stage: deal.stage,
            changedAt: new Date(),
            changedBy: deal._id, // Use own id as placeholder since original creator unknown
          },
        },
      }
    )
  }

  return NextResponse.json({
    success: true,
    totalMigrated,
    stageHistorySeeded: dealsWithoutHistory.length,
    breakdown: results,
  })
}
