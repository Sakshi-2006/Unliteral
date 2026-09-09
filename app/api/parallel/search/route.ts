import { NextResponse } from 'next/server'
import { searchParallel } from '../../../../lib/parallel'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { objective?: unknown; search_queries?: unknown }
    const objective = typeof body.objective === 'string' ? body.objective.trim() : ''
    const searchQueries = Array.isArray(body.search_queries)
      ? body.search_queries.filter((query): query is string => typeof query === 'string' && query.trim().length > 0).map(query => query.trim())
      : []

    if (!objective) return NextResponse.json({ success: false, error: 'objective is required.' }, { status: 400 })
    if (objective.length > 2000) return NextResponse.json({ success: false, error: 'objective is too long.' }, { status: 400 })

    const results = await searchParallel(objective, searchQueries)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parallel search failed.'
    const status = message.includes('not configured') ? 503 : 502
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
