import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 아무것도 검사하지 않고 그냥 통과시킵니다.
  return NextResponse.next()
}

// 감시 대상에서도 빼버립니다.
export const config = {
  matcher: [], 
}