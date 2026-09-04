import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Email verification provider is not configured.' }, { status: 503 })
}
