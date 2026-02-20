import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { connectDB } from '@/lib/db/mongodb'
import DocumentModel from '@/lib/models/Document'
import Deal from '@/lib/models/Deal'
import User from '@/lib/models/User'
import { parseCSV, parseExcel, parsePDF } from '@/lib/utils/document-parser'
import { getScopeFilter } from '@/lib/utils/api-utils'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_SIZE   = 10 * 1024 * 1024  // 10 MB
const ALLOWED    = new Set(['text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf'])



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(d: any) {
  return {
    id:            d._id.toString(),
    dealId:        d.dealId.toString(),
    filename:      d.filename,
    originalName:  d.originalName,
    mimeType:      d.mimeType,
    size:          d.size,
    uploadedAt:    d.uploadedAt,
    extractedData: d.extractedData ?? null,
    status:        d.status,
    errorMessage:  d.errorMessage ?? null,
  }
}

/** GET /api/deals/[id]/documents — list documents for a deal */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dealId } = await params
    await connectDB()

    // Verify deal access
    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOne({ _id: dealId, ...scopeFilter }).select('_id').lean()
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const docs = await DocumentModel.find({ dealId }).sort({ uploadedAt: -1 }).lean()
    return NextResponse.json(docs.map(mapDoc))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/deals/[id]/documents — upload and parse a financial document */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dealId } = await params
    await connectDB()

    // Verify deal access
    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOne({ _id: dealId, ...scopeFilter }).select('_id').lean()
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate type
    const mimeType = file.type
    if (!ALLOWED.has(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: CSV, Excel (.xlsx/.xls), PDF' },
        { status: 400 }
      )
    }

    // Validate size
    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(arrayBuffer)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedFilename = `${dealId}-${Date.now()}-${safeName}`
    const filePath = path.join(UPLOAD_DIR, storedFilename)

    // Save to disk
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(filePath, buffer)

    // Create DB record with processing status
    const doc = await DocumentModel.create({
      dealId,
      userId,
      filename:     storedFilename,
      originalName: file.name,
      mimeType,
      size:         arrayBuffer.byteLength,
      status:       'processing',
    })

    // Run parser
    try {
      let extractedData
      if (mimeType === 'text/csv') {
        extractedData = await parseCSV(buffer)
      } else if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        extractedData = await parseExcel(buffer)
      } else {
        extractedData = await parsePDF(buffer)
      }

      await DocumentModel.updateOne(
        { _id: doc._id },
        { $set: { extractedData, status: 'done' } }
      )
      doc.extractedData = extractedData
      doc.status = 'done'
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : 'Parse failed'
      await DocumentModel.updateOne(
        { _id: doc._id },
        { $set: { status: 'failed', errorMessage: msg } }
      )
      doc.status = 'failed'
    }

    const fresh = await DocumentModel.findById(doc._id).lean()
    return NextResponse.json(mapDoc(fresh), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
