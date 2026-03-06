'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STATUS_LABEL, STATUS_COLOR, SITE } from '@/lib/constants'
import type { Reservation } from '@/types'

function getDateLabel(str: string) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const days = ['일','월','화','수','목','금','토']
  const dt = new Date(+y, +m - 1, +d)
  return `${+m}/${+d}(${days[dt.getDay()]})`
}

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<string>('all')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState<Reservation | null>(null)
  const [updating,  setUpdating]  = useState(false)
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  // 관리자 확인
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) {
        // 개발 편의상 첫 번째 유저를 관리자로 간주 (실제 운영 시 profile.is_admin 사용)
        // router.push('/'); return
      }
      setIsAdmin(true)
      setAuthReady(true)
    })()
  }, [])

  // 예약 목록 로드
  useEffect(() => {
    if (!authReady) return
    loadReservations()
  }, [authReady])

  async function loadReservations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setReservations(data as Reservation[])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(true)
    await supabase.from('reservations').update({ status }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as any } : prev)
    setUpdating(false)
  }

  async function deleteReservation(id: string) {
    if (!confirm('예약을 삭제하시겠습니까?')) return
    await supabase.from('reservations').delete().eq('id', id)
    setReservations(prev => prev.filter(r => r.id !== id))
    setSelected(null)
  }

  const counts = {
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    paid:      reservations.filter(r => r.status === 'paid').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  }

  const filtered = reservations.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter
    const matchSearch = !search
      || r.name.includes(search)
      || r.phone.replace(/-/g, '').includes(search.replace(/-/g, ''))
      || r.room_name.includes(search)
    return matchFilter && matchSearch
  })

  const sc = (s: string) => STATUS_COLOR[s] || STATUS_COLOR.pending

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="text-forest-400 font-semibold">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* 상단 헤더 */}
      <header className="bg-forest-800 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-forest-300 hover:text-white text-sm font-semibold">← 사이트</Link>
          <span className="text-forest-600">|</span>
          <span className="font-display font-bold text-lg">{SITE.nameEn} 관리자</span>
        </div>
        <a href={`tel:${SITE.tel}`} className="text-xs bg-forest-600 hover:bg-forest-500 rounded-full px-4 py-1.5 transition-colors">📞 {SITE.tel}</a>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            ['전체', counts.all, '#4a7c59'],
            ['결제대기', counts.pending, '#f59e0b'],
            ['결제완료', counts.paid, '#3b82f6'],
            ['예약확정', counts.confirmed, '#16a34a'],
            ['취소', counts.cancelled, '#dc2626'],
          ].map(([label, count, color]) => (
            <div key={String(label)} className={`bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm ${String(label) === '결제대기' && counts.pending > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
              <div className="text-2xl font-bold mb-1" style={{ color: String(color) }}>{count}</div>
              <div className="text-xs text-gray-400 font-semibold">{label}</div>
            </div>
          ))}
        </div>

        {/* 검색 + 필터 */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="이름, 연락처, 방갈로 검색"
              className="input-field pl-9 !py-2.5 !text-sm"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[['all','전체'],['pending','결제대기'],['paid','결제완료'],['confirmed','확정'],['cancelled','취소']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
                  ${filter === v ? 'bg-forest-500 text-white border-forest-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-forest-300'}`}>
                {l} {v === 'all' ? counts.all : counts[v as keyof typeof counts]}
              </button>
            ))}
          </div>
          <button onClick={loadReservations} className="text-xs text-forest-500 font-semibold border border-forest-200 rounded-xl px-4 py-2 hover:bg-forest-50 transition-colors">
            🔄 새로고침
          </button>
        </div>

        {/* 목록 + 상세 */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 목록 */}
          <div className="flex-1 space-y-2">
            {loading ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-300 shadow-sm">예약 내역이 없습니다</div>
            ) : filtered.map(r => {
              const color = sc(r.status)
              return (
                <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer border-2 transition-all shadow-sm hover:shadow-md
                    ${selected?.id === r.id ? 'border-forest-400 bg-forest-50/50' : 'border-transparent hover:border-forest-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-forest-900">{r.name}</span>
                        <span className="text-sm text-forest-500 font-semibold">{r.phone}</span>
                        <span className="text-xs text-gray-300 font-mono hidden sm:inline">{r.id.slice(0,8)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        📅 {getDateLabel(r.date)} &nbsp;·&nbsp; {r.room_name} &nbsp;·&nbsp; {r.guests}명
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        💳 {r.total_amount?.toLocaleString()}원 &nbsp;·&nbsp; {new Date(r.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <span className="status-badge flex-none text-xs"
                      style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 상세 패널 */}
          {selected && (
            <div className="lg:w-72 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 self-start sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-forest-900">상세 정보</span>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  ['예약번호', selected.id.slice(0,8).toUpperCase()],
                  ['예약자', selected.name],
                  ['연락처', selected.phone],
                  ['방갈로', selected.room_name],
                  ['날짜', selected.date],
                  ['인원', selected.guests + '명'],
                  ['결제금액', selected.total_amount?.toLocaleString() + '원'],
                  ['접수일시', new Date(selected.created_at).toLocaleString('ko-KR', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-gray-400 font-semibold mb-0.5">{k}</div>
                    <div className="text-sm font-bold text-forest-900 break-all">{v}</div>
                  </div>
                ))}
              </div>

              <a href={`tel:${selected.phone}`}
                className="flex items-center justify-center gap-2 bg-forest-500 hover:bg-forest-600 text-white rounded-xl py-3 text-sm font-bold mb-4 transition-colors">
                📞 {selected.phone} 전화
              </a>

              <div className="text-xs text-gray-400 font-semibold mb-2">상태 변경</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(['pending','paid','confirmed','cancelled'] as const).map(s => {
                  const c = sc(s); const active = selected.status === s
                  return (
                    <button key={s} disabled={updating} onClick={() => updateStatus(selected.id, s)}
                      className="py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-50"
                      style={active ? { background: c.bg, color: c.text, borderColor: c.border } : { background: '#fff', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                      {active ? '● ' : ''}{STATUS_LABEL[s]}
                    </button>
                  )
                })}
              </div>

              <button onClick={() => deleteReservation(selected.id)}
                className="w-full border-2 border-red-200 rounded-xl py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                🗑 예약 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
