import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { connectDB } from '@/lib/db/mongodb'
import DocumentModel from '@/lib/models/Document'
import Deal from '@/lib/models/Deal'
import User from '@/lib/models/User'
import { getScopeFilter } from '@/lib/utils/api-utils'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

/** DELETE /api/deals/[id]/documents/[docId] — remove a document */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dealId, docId } = await params
    await connectDB()

    // Verify deal access
    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOne({ _id: dealId, ...scopeFilter }).select('_id').lean()
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Find and delete the document
    const doc = await DocumentModel.findOneAndDelete({ _id: docId, dealId }).lean()
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Remove file from disk (non-fatal)
    try {
      await fs.unlink(path.join(UPLOAD_DIR, doc.filename))
    } catch { /* file may already be gone */ }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
