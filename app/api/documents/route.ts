import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { getDocuments, deleteDocument } from '@/lib/database'

export async function GET() {
  try {
    // TODO: Implement proper authentication check for API routes
    // For now, we'll proceed without auth for development purposes

    const documents = await getDocuments()

    return NextResponse.json({
      success: true,
      data: documents
    })

  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check for API routes
    // For now, we'll proceed without auth for development purposes

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    await deleteDocument(parseInt(documentId))

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Delete document API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
