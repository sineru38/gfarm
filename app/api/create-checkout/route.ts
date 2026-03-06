import { NextRequest, NextResponse } from 'next/server'
import { stripe, getStripePriceId } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase/server'
import { ROOM_MAP } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomId, date, guests, name, phone, userId } = body

    // ── 입력 검증 ──────────────────────────
    if (!roomId || !date || !name || !phone || !userId) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }
    const room = ROOM_MAP[roomId]
    if (!room) return NextResponse.json({ error: '유효하지 않은 방갈로입니다.' }, { status: 400 })

    // ── 로그인 유저 확인 ───────────────────
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // ── 중복 예약 확인 ─────────────────────
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', roomId)
      .eq('date', date)
      .in('status', ['pending', 'paid', 'confirmed'])
      .single()

    if (existing) {
      return NextResponse.json({ error: '해당 날짜에 이미 예약된 방갈로입니다.' }, { status: 409 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // ── Stripe Checkout 세션 생성 ──────────
    // Stripe Price ID가 없는 경우 price_data로 동적 생성
    let lineItem: any

    try {
      const priceId = getStripePriceId(roomId)
      lineItem = { price: priceId, quantity: 1 }
    } catch {
      // Price ID 미설정 시 동적 가격으로 폴백
      lineItem = {
        price_data: {
          currency: 'krw',
          unit_amount: room.price,
          product_data: {
            name: `그라운드팜 ${room.name}`,
            description: `${date} 1박 · ${room.capacity} · ${room.desc}`,
            images: [],
          },
        },
        quantity: 1,
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/reserve?cancelled=1`,
      metadata: {
        user_id:   userId,
        room_id:   String(roomId),
        room_name: room.name,
        date,
        guests:    String(guests),
        name,
        phone,
      },
      payment_intent_data: {
        metadata: { room_id: String(roomId), date, user_id: userId },
      },
      locale: 'ko',
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('[create-checkout] error:', err)
    return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 })
  }
}
