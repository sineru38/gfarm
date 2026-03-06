import Link from 'next/link'
import { stripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase/server'

interface Props {
  searchParams: { session_id?: string }
}

export default async function SuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id

  let reservation: any = null
  let sessionData: any = null

  if (sessionId) {
    try {
      // Stripe 세션 정보 조회
      sessionData = await stripe.checkout.sessions.retrieve(sessionId)

      // Supabase에서 예약 정보 조회 (webhook이 먼저 처리됐을 수도 있으므로 폴링)
      const supabase = createAdminSupabase()
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from('reservations')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single()
        if (data) { reservation = data; break }
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (e) {
      console.error('Success page error:', e)
    }
  }

  const meta = sessionData?.metadata

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg,#f0f7f1,#e6eedd,#f5efe6)' }}>
      <div className="max-w-md w-full">

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h1 className="font-display text-2xl font-bold text-forest-900 mb-2">예약 완료!</h1>
          <p className="text-gray-500 text-sm font-light mb-8 leading-relaxed">
            결제가 성공적으로 완료되었습니다.<br/>
            <strong className="text-forest-600">{meta?.phone || ''}</strong>으로 확인 연락드릴게요.
          </p>

          {/* 예약 요약 */}
          {meta && (
            <div className="bg-forest-50 border border-forest-100 rounded-2xl p-5 text-left mb-8 space-y-3">
              {[
                ['방갈로', meta.room_name],
                ['날짜',   meta.date],
                ['인원',   meta.guests + '명'],
                ['예약자', meta.name],
                ['연락처', meta.phone],
                ['결제금액', sessionData?.amount_total
                  ? (sessionData.amount_total).toLocaleString() + '원'
                  : '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">{label}</span>
                  <span className="font-bold text-forest-800">{value}</span>
                </div>
              ))}
              {reservation?.id && (
                <div className="pt-2 border-t border-forest-100 flex justify-between text-xs">
                  <span className="text-gray-400">예약번호</span>
                  <span className="font-mono text-forest-500 font-bold">{reservation.id.slice(0, 8).toUpperCase()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/reserve" className="btn-primary !rounded-2xl !py-3.5 text-sm">+ 새 예약하기</Link>
            <Link href="/"        className="btn-outline !rounded-2xl !py-3.5 text-sm">← 메인으로</Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          문의: <a href="tel:1800-5171" className="text-forest-500 font-semibold">1800-5171</a>
        </p>
      </div>
    </div>
  )
}
