import 'server-only'

import Parallel from 'parallel-web'

export type ParallelSearchItem = {
  title: string
  url: string
  excerpts: string[]
}

function getClient() {
  const apiKey = process.env.PARALLEL_API_KEY?.trim()
  if (!apiKey) return null
  return new Parallel({ apiKey })
}

export function isParallelConfigured() {
  return Boolean(process.env.PARALLEL_API_KEY?.trim())
}

export async function searchParallel(objective: string, searchQueries: string[] = []): Promise<ParallelSearchItem[]> {
  const client = getClient()
  if (!client) throw new Error('PARALLEL_API_KEY is not configured.')

  console.log('[Parallel] request started')
  try {
    const queries = searchQueries.filter(Boolean).slice(0, 5)
    const response = await client.search({
      objective,
      search_queries: queries.length ? queries : [objective.slice(0, 120)],
      mode: 'fast',
      max_chars_total: 12000,
    })
    const results = response.results.map((result) => ({
      title: result.title || 'Untitled source',
      url: result.url,
      excerpts: result.excerpts || [],
    }))
    console.log('[Parallel] results received')
    console.log('[Parallel] result count', results.length)
    return results
  } catch (error) {
    console.error('[Parallel] request failed', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}
