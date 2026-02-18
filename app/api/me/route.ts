import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/get-current-user'

export async function GET() {
  const userId = await getCurrentUserId()
  return NextResponse.json({ userId })
}
