'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ROOMS, SITE } from '@/lib/constants'
import type { Room } from '@/types'
import Navbar from '@/components/ui/Navbar'

// ── 날짜 헬퍼 함수 ──
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

// ── 미니 캘린더 컴포넌트 ──
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
        <button onClick={prev} className="text-forest-500 font-bold text-xl px-3 py-1">‹</button>
        <span className="font-bold text-forest-900 text-sm">{curY}년 {MN[curM]}</span>
        <button onClick={next} className="text-forest-500 font-bold text-xl px-3 py-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {DN.map((d, i) => (
          <div key={d} className={`font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={'e' + i} />
          const str = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = str < today
          return (
            <button key={day} disabled={isPast} onClick={() => onSelect(str)}
              className={`rounded-lg py-2 transition-all ${str === selected ? 'bg-forest-500 text-white font-bold' : isPast ? 'text-gray-200' : 'hover:bg-forest-50 text-gray-700'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 실제 예약 폼 (알맹이) ──
function ReserveContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [selRoom, setSelRoom] = useState<Room | null>(null)
  const [selDate, setSelDate] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bookedRooms, setBookedRooms] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId) {
      const found = ROOMS.find(r => r.id === Number(roomId))
      if (found) setSelRoom(found)
    }
  }, [searchParams])

  useEffect(() => {
    if (!selDate) return
    supabase.from('reservations').select('room_id').eq('date', selDate).in('status', ['pending', 'paid', 'confirmed'])
      .then(({ data }) => setBookedRooms(data?.map(r => r.room_id) ?? []))
  }, [selDate])

  async function handleCheckout() {
    if (!selRoom || !selDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: selRoom.id, date: selDate, name, phone }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      alert('에러가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-900 mb-2">방갈로 예약</h1>
        <p className="text-forest-500 text-sm font-light">자연 속 그라운드팜에서의 특별한 하룻밤</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
        {step === 1 && (
          <div>
            <h2 className="font-bold text-forest-900 text-lg mb-5">🏡 방갈로 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ROOMS.map(room => (
                <button key={room.id} onClick={() => setSelRoom(room)}
                  className={`text-left rounded-2xl border-2 p-4 ${selRoom?.id === room.id ? 'border-forest-500 bg-forest-50' : 'border-gray-200'}`}>
                  <div className="font-bold text-forest-900">{room.name}</div>
                  <div className="text-sm text-forest-600">{room.price.toLocaleString()}원</div>
                </button>
              ))}
            </div>
            <h2 className="font-bold text-forest-900 text-lg mb-4">📅 날짜 선택</h2>
            <MiniCalendar selected={selDate} onSelect={setSelDate}/>
            <button disabled={!selRoom || !selDate} onClick={() => setStep(2)} className="btn-primary w-full mt-6 py-4 rounded-xl font-bold">다음 단계</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-bold text-forest-900 text-lg mb-5">👤 정보 입력</h2>
            <input className="w-full p-3 border rounded-xl mb-3" placeholder="이름" value={name} onChange={e => setName(e.target.value)}/>
            <input className="w-full p-3 border rounded-xl mb-3" placeholder="연락처" value={phone} onChange={e => setPhone(e.target.value)}/>
            <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full py-4 rounded-xl font-bold bg-forest-500 text-white">
              {loading ? '처리 중...' : '결제하기'}
            </button>
            <button onClick={() => setStep(1)} className="w-full mt-3 text-sm text-gray-400">이전으로</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 페이지 (보호막) ──
export default function ReservePage() {
  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <Suspense fallback={<div className="pt-40 text-center font-bold">로딩 중...</div>}>
        <ReserveContent />
      </Suspense>
    </div>
  )
}
