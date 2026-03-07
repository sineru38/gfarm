'use client'
export const dynamic = 'force-dynamic' // 이 줄을 추가하세요!
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ROOMS, SITE } from '@/lib/constants'
import type { Room } from '@/types'
import Navbar from '@/components/ui/Navbar'

// ── 날짜 헬퍼 ─────────────────────────────
function getTodayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function getDateLabel(str: string) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dt = new Date(+y, +m - 1, +d)
  return `${+y}년 ${+m}월 ${+d}일 (${days[dt.getDay()]})`
}

// ── 미니 캘린더 ────────────────────────────
function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
  const today = getTodayStr()
  const now = new Date()
  const [curY, setCurY] = useState(now.getFullYear())
  const [curM, setCurM] = useState(now.getMonth())
  const MN = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const DN = ['일','월','화','수','목','금','토']
  const firstDow = new Date(curY, curM, 1).getDay()
  const dim = new Date(curY, curM + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let i = 1; i <= dim; i++) cells.push(i)

  const prev = () => curM === 0 ? (setCurY(y => y - 1), setCurM(11)) : setCurM(m => m - 1)
  const next = () => curM === 11 ? (setCurY(y => y + 1), setCurM(0)) : setCurM(m => m + 1)

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <button onClick={prev} className="text-forest-500 font-bold text-xl px-3 py-1 rounded-lg hover:bg-forest-100 transition-colors">‹</button>
        <span className="font-bold text-forest-900 text-sm">{curY}년 {MN[curM]}</span>
        <button onClick={next} className="text-forest-500 font-bold text-xl px-3 py-1 rounded-lg hover:bg-forest-100 transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DN.map((d, i) => (
          <div key={d} className={`text-xs font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={'e' + i} />
          const str = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = str < today
          const isSel = str === selected
          const isToday = str === today
          const dow = (firstDow + day - 1) % 7
          return (
            <button key={day} disabled={isPast} onClick={() => onSelect(str)}
              className={`rounded-lg py-2 text-sm font-medium transition-all
                ${isSel ? 'bg-forest-500 text-white font-bold' :
                  isToday ? 'bg-forest-100 text-forest-700 font-bold' :
                  isPast ? 'text-gray-300 cursor-not-allowed' :
                  dow === 0 ? 'text-red-400 hover:bg-red-50' :
                  dow === 6 ? 'text-blue-400 hover:bg-blue-50' :
                  'text-gray-700 hover:bg-forest-50'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 예약 현황 뱃지 ─────────────────────────
function AvailabilityBadge({ roomId, date, bookedRooms }: { roomId: number; date: string; bookedRooms: number[] }) {
  if (!date) return null
  const isBooked = bookedRooms.includes(roomId)
  return (
    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${isBooked ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
      {isBooked ? '예약마감' : '예약가능'}
    </span>
  )
}

// ── 메인 예약 컴포넌트 ──────────────────────
export default function ReservePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [user,        setUser]        = useState<any>(null)
  const [step,        setStep]        = useState(1)
  const [selRoom,     setSelRoom]     = useState<Room | null>(null)
  const [selDate,     setSelDate]     = useState('')
  const [guests,      setGuests]      = useState(1)
  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [bookedRooms, setBookedRooms] = useState<number[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  // URL 파라미터로 방 사전선택
  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId) {
      const found = ROOMS.find(r => r.id === Number(roomId))
      if (found) setSelRoom(found)
    }
  }, [searchParams])

  // 로그인 유저 확인 + 프로필 자동 채우기
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', data.user.id)
          .single()
        if (profile?.name)  setName(profile.name)
        if (profile?.phone) setPhone(profile.phone)
      }
    })
  }, [])

  // 선택 날짜의 예약 현황 조회
  useEffect(() => {
    if (!selDate) return
    supabase
      .from('reservations')
      .select('room_id')
      .eq('date', selDate)
      .in('status', ['pending', 'paid', 'confirmed'])
      .then(({ data }) => {
        setBookedRooms(data?.map(r => r.room_id) ?? [])
      })
  }, [selDate])

  async function handleCheckout() {
    if (!user)    { router.push('/auth/login'); return }
    if (!selRoom) { setError('방갈로를 선택해 주세요.'); return }
    if (!selDate) { setError('날짜를 선택해 주세요.'); return }
    if (!name.trim()) { setError('예약자 이름을 입력해 주세요.'); return }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) { setError('올바른 연락처를 입력해 주세요.'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:   selRoom.id,
          date:     selDate,
          guests,
          name:     name.trim(),
          phone:    phone.trim(),
          userId:   user.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '결제 세션 생성 실패')
      window.location.href = data.url  // Stripe Checkout으로 이동
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const canStep2 = !!selRoom && !!selDate
  const isRoomBooked = (roomId: number) => bookedRooms.includes(roomId)

  // ── 렌더 ──────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f7f1,#e6eedd,#f5efe6)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-forest-900 mb-2">방갈로 예약</h1>
          <p className="text-forest-500 text-sm font-light">자연 속 그라운드팜에서의 특별한 하룻밤</p>
        </div>

        {/* 미로그인 안내 */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-center">
            <p className="text-amber-700 font-semibold text-sm mb-3">로그인 후 예약 및 결제를 진행할 수 있습니다</p>
            <Link href="/auth/login" className="btn-primary !py-2 !px-6 !text-sm">로그인 / 회원가입</Link>
          </div>
        )}

        {/* 스텝 인디케이터 */}
        <div className="flex items-center mb-8 bg-white rounded-2xl p-4 shadow-sm">
          {[['1', '방·날짜 선택'], ['2', '예약자 정보'], ['3', '결제']].map((item, i) => {
            const done = step > i + 1, active = step === i + 1
            return (
              <div key={item[0]} className={`flex items-center ${i < 2 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${done || active ? 'bg-forest-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? '✓' : item[0]}
                  </div>
                  <div className={`text-xs mt-1 font-semibold whitespace-nowrap ${done || active ? 'text-forest-500' : 'text-gray-400'}`}>
                    {item[1]}
                  </div>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-forest-500' : 'bg-gray-200'}`}/>}
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">

          {/* ── STEP 1: 방 + 날짜 선택 ── */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-forest-900 text-lg mb-5">🏡 방갈로 선택</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {ROOMS.map(room => {
                  const booked = isRoomBooked(room.id)
                  const isSelected = selRoom?.id === room.id
                  return (
                    <button key={room.id} disabled={booked}
                      onClick={() => setSelRoom(room)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all
                        ${isSelected ? 'border-forest-500 bg-forest-50' :
                          booked ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' :
                          'border-gray-200 hover:border-forest-300 hover:bg-forest-50/30'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{room.icon}</span>
                          <div>
                            <div className="font-bold text-forest-900 text-sm">{room.name}</div>
                            <div className="text-xs text-gray-400">{room.capacity}</div>
                          </div>
                        </div>
                        {selDate && <AvailabilityBadge roomId={room.id} date={selDate} bookedRooms={bookedRooms}/>}
                        {isSelected && !booked && <span className="text-forest-500 font-bold text-lg">✓</span>}
                      </div>
                      <p className="text-xs text-gray-500 font-light mb-2">{room.desc}</p>
                      <div className="font-bold text-forest-600 text-sm">{room.price.toLocaleString()}원 / 1박</div>
                    </button>
                  )
                })}
              </div>

              <h2 className="font-bold text-forest-900 text-lg mb-4">📅 날짜 선택</h2>
              <MiniCalendar selected={selDate} onSelect={setSelDate}/>

              {selDate && (
                <div className="mt-4 bg-forest-50 border border-forest-200 rounded-xl px-4 py-3 text-forest-700 text-sm font-semibold">
                  선택한 날짜: {getDateLabel(selDate)}
                </div>
              )}

              <button disabled={!canStep2} onClick={() => setStep(2)}
                className={`btn-primary w-full mt-6 !rounded-2xl !py-4 !text-base ${!canStep2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                다음 단계 →
              </button>
            </div>
          )}

          {/* ── STEP 2: 예약자 정보 ── */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-forest-500 font-semibold text-sm mb-5 flex items-center gap-1 hover:underline">
                ← 이전 단계
              </button>

              {/* 선택 요약 */}
              <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs block">방갈로</span><span className="font-bold text-forest-800">{selRoom?.icon} {selRoom?.name}</span></div>
                <div><span className="text-gray-400 text-xs block">날짜</span><span className="font-bold text-forest-800">{getDateLabel(selDate)}</span></div>
                <div><span className="text-gray-400 text-xs block">요금</span><span className="font-bold text-forest-600">{selRoom?.price.toLocaleString()}원</span></div>
                <div><span className="text-gray-400 text-xs block">최대 인원</span><span className="font-bold text-forest-800">{selRoom?.capacity}</span></div>
              </div>

              <h2 className="font-bold text-forest-900 text-lg mb-5">👤 예약자 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">예약자 이름 *</label>
                  <input className="input-field" type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">연락처 *</label>
                  <input className="input-field" type="tel" placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">방문 인원 *</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-300 text-forest-500 font-bold text-xl flex items-center justify-center hover:bg-forest-100 transition-colors">−</button>
                    <span className="text-xl font-bold text-forest-900 w-8 text-center">{guests}</span>
                    <button onClick={() => setGuests(g => Math.min(selRoom?.capacity ? parseInt(selRoom.capacity) : 8, g + 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-300 text-forest-500 font-bold text-xl flex items-center justify-center hover:bg-forest-100 transition-colors">+</button>
                    <span className="text-sm text-gray-400">{selRoom?.capacity}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-semibold">⚠️ {error}</div>
              )}

              {/* 결제 요약 */}
              <div className="mt-6 bg-gray-50 rounded-2xl p-5">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{selRoom?.name} × 1박</span>
                  <span>{selRoom?.price.toLocaleString()}원</span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-forest-900">
                  <span>총 결제금액</span>
                  <span className="text-xl text-forest-500">{selRoom?.price.toLocaleString()}원</span>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading || !user}
                className={`btn-primary w-full mt-5 !rounded-2xl !py-4 !text-base ${loading || !user ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? '결제 페이지로 이동 중...' : !user ? '로그인 필요' : `💳 ${selRoom?.price.toLocaleString()}원 결제하기`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Stripe 보안 결제 · 카드/간편결제 지원</p>
            </div>
          )}

        </div>

        {/* 연락처 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          예약 문의: <a href={`tel:${SITE.tel}`} className="text-forest-500 font-semibold">{SITE.tel}</a>
        </p>
      </div>
    </div>
  )
}
