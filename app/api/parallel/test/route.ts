import { NextResponse } from 'next/server'
import { isParallelConfigured, searchParallel } from '../../../../lib/parallel'

export async function GET() {
  const configured = isParallelConfigured()
  if (!configured) return NextResponse.json({ configured: false, success: false, resultCount: 0, sources: [], error: 'PARALLEL_API_KEY is not configured.' }, { status: 503 })

  try {
    const results = await searchParallel(
      'What is jugaad in Indian culture and how is the term commonly used?',
      ['jugaad meaning Indian culture', 'jugaad common usage Hindi India'],
    )
    return NextResponse.json({ configured: true, success: true, resultCount: results.length, sources: results.map(result => ({ title: result.title, url: result.url })) })
  } catch (error) {
    return NextResponse.json({ configured: true, success: false, resultCount: 0, sources: [], error: error instanceof Error ? error.message : 'Parallel test search failed.' }, { status: 502 })
  }
}
