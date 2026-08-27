import { NextResponse } from 'next/server'
import { mediaStatus } from '../../../../lib/mediaProviders'
export async function GET(){return NextResponse.json(mediaStatus)}
