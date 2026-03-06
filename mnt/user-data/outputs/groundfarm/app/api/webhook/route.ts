import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Next.js 14: body를 raw buffer로 읽어야 Stripe 서명 검증 가능
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[webhook] 서명 검증 실패:', err.message)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  // ── 결제 완료 이벤트 ───────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta    = session.metadata!

    // 이미 처리된 세션인지 확인
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    if (existing) {
      console.log('[webhook] 이미 처리된 세션:', session.id)
      return NextResponse.json({ received: true })
    }

    // ── Supabase reservations에 저장 ──────
    const { error } = await supabase.from('reservations').insert({
      user_id:               meta.user_id,
      room_id:               Number(meta.room_id),
      room_name:             meta.room_name,
      date:                  meta.date,
      guests:                Number(meta.guests),
      name:                  meta.name,
      phone:                 meta.phone,
      status:                'paid',
      stripe_session_id:     session.id,
      stripe_payment_intent: session.payment_intent as string,
      total_amount:          session.amount_total ?? 0,
    })

    if (error) {
      console.error('[webhook] DB 저장 실패:', error)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    console.log(`[webhook] ✅ 예약 저장 완료: ${meta.room_name} / ${meta.date} / ${meta.name}`)
  }

  // ── 결제 만료/실패 시 상태 업데이트 ────────
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('stripe_session_id', session.id)
  }

  return NextResponse.json({ received: true })
}
