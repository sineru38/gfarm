'use client'

import { Suspense, useState, useEffect } from 'react'
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

// ── 실제 예약 폼 알맹이 ──────────────────
function ReserveContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [selRoom, setSelRoom] = useState<Room | null>(null)
  const [selDate, setSelDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bookedRooms, setBookedRooms] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId) {
      const found = ROOMS.find(r => r.id === Number(roomId))
      if (found) setSelRoom(found)
    }
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('name, phone').eq('id', data.user.id).single()
        if (profile?.name) setName(profile.name)
        if (profile?.phone) setPhone(profile.phone)
      }
    })
  }, [])

  useEffect(() => {
    if (!selDate) return
    supabase.from('reservations').select('room_id').eq('date', selDate).in('status', ['pending', 'paid', 'confirmed'])
      .then(({ data }) => { setBookedRooms(data?.map(r => r.room_id) ?? []) })
  }, [selDate])

  async function handleCheckout() {
    if (!user) { router.push('/auth/login'); return }
    if (!selRoom) { setError('방갈로를 선택해 주세요.'); return }
    if (!selDate) { setError('날짜를 선택해 주세요.'); return }
    if (!name.trim()) { setError('예약자 이름을 입력해 주세요.'); return }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) { setError('올바른 연락처를 입력해 주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: selRoom.id, date: selDate, guests, name: name.trim(), phone: phone.trim(), userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '결제 세션 생성 실패')
      window.location.href = data.url
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  const canStep2 = !!selRoom && !!selDate

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
              {ROOMS.map(room => {
                const booked = bookedRooms.includes(room.id)
                const isSelected = selRoom?.id === room.id
                return (
                  <button key={room.id} disabled={booked} onClick={() => setSelRoom(room)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-forest-500 bg-forest-50' : booked ? 'border-gray-200 bg-
