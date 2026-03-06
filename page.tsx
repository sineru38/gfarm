"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// 예약 데이터의 모양 정의
interface Reservation {
  id: string
  bungalow_number: number
  booking_date: string
  booking_time: string
  guest_name: string
  guest_phone: string
  payment_status: string
  created_at: string
}

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // 슈파베이스에서 데이터 가져오는 함수
  const fetchReservations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false }) // 최신순 정렬

    if (error) {
      console.error('데이터 로드 실패:', error)
    } else {
      setReservations(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🚜 방갈로 예약 관리 장부</h1>
          <button 
            onClick={() => fetchReservations()}
            className="bg-forest-500 text-white px-4 py-2 rounded-lg hover:bg-forest-600 transition-all"
          >
            새로고침 🔄
          </button>
        </div>

        {loading ? (
          <p>장부를 불러오는 중...</p>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-4 font-bold text-gray-600">예약일시</th>
                  <th className="p-4 font-bold text-gray-600">방갈로</th>
                  <th className="p-4 font-bold text-gray-600">예약자</th>
                  <th className="p-4 font-bold text-gray-600">연락처</th>
                  <th className="p-4 font-bold text-gray-600">결제상태</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">
                      <div className="font-semibold">{res.booking_date}</div>
                      <div className="text-gray-400 text-xs">{res.booking_time}</div>
                    </td>
                    <td className="p-4 font-bold text-forest-600">{res.bungalow_number}호</td>
                    <td className="p-4">{res.guest_name}</td>
                    <td className="p-4 text-blue-600 underline">
                      <a href={`tel:${res.guest_phone}`}>{res.guest_phone}</a>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        res.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {res.payment_status === 'paid' ? '결제완료' : '입금대기'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reservations.length === 0 && (
              <div className="p-20 text-center text-gray-400">아직 예약 내역이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { ROOMS, SITE } from '@/lib/constants'

const SERVICES = [
  { id: 'garden',   title: '텃밭 분양',     subtitle: 'My Little Garden', desc: '나만의 텃밭을 분양받아 직접 채소와 허브를 키워보세요. 월별 관리 프로그램과 함께 제공됩니다.', tags: ['연간 계약', '씨앗 키트'], color: '#3d6b4f', bg: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', accent: '#2e7d32', num: '01' },
  { id: 'bungalow', title: '방갈로 예약',   subtitle: 'Stay & Breathe',   desc: '자연 속 아늑한 방갈로에서 하룻밤. 새벽 새소리와 별빛을 만끽하세요.',                            tags: ['6개 방갈로', '당일 결제'], color: '#6d4c2a', bg: 'linear-gradient(135deg,#fdf3e7,#f5dfc0)', accent: '#a1590f', num: '02' },
  { id: 'program',  title: '체험 프로그램', subtitle: 'Hands-on Nature',  desc: '김장 담그기, 천연 염색, 도자기 체험. 가족과 잊지 못할 추억을 만드세요.',                          tags: ['주말 운영', '어린이 환영'], color: '#4a6741', bg: 'linear-gradient(135deg,#f1f8e9,#dcedc8)', accent: '#558b2f', num: '03' },
]

const TESTIMONIALS = [
  { name: '김지은', tag: '텃밭 분양 이용', text: '아이들이 직접 키운 토마토를 먹고 너무 행복해했어요. 도시 생활에 자연을 선물한 느낌!' },
  { name: '박민준', tag: '방갈로 숙박',    text: '새소리에 눈을 뜨고 별빛 아래 잠드는 경험, 오랫동안 기억에 남을 것 같아요.' },
  { name: '이서연', tag: '체험 프로그램',  text: '스태프분들이 너무 친절하셨어요. 아이가 흙놀이를 정말 좋아했어요!' },
]

export default function HomePage() {
  return (
    <div className="bg-sand-50 min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#f0f7f1 0%,#e8f0e0 45%,#f5efe6 100%)' }}>
        {/* 배경 원형 블러 */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle,rgba(74,124,89,.12) 0%,transparent 70%)' }}/>
        <div className="absolute -bottom-24 -left-16 w-[480px] h-[480px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,rgba(161,89,15,.08) 0%,transparent 70%)' }}/>

        <div className="relative z-10 text-center max-w-2xl mx-auto px-5 animate-fade-up">
          {/* 배지 */}
          <div className="inline-flex items-center gap-2 bg-forest-100 border border-forest-300 text-forest-700 rounded-full px-4 py-1.5 text-xs font-bold mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-400 inline-block"/>
            2026 봄 시즌 예약 오픈
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-forest-900 mb-4">
            땅과 가까워지는<br/>
            <em className="text-forest-500 not-italic">나만의 쉼표</em>
          </h1>
          <p className="text-forest-600 text-base sm:text-lg font-light leading-relaxed mb-3">
            경기도 용인 깊은 산자락, 친환경 주말농장
          </p>
          <p className="text-forest-500/80 text-sm sm:text-base font-light leading-relaxed mb-10">
            텃밭 분양, 방갈로 숙박, 계절 체험 프로그램<br className="hidden sm:block"/>
            그라운드팜에서 자연과 함께하는 하루
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/reserve" className="btn-primary text-base px-10 py-4">
              🏡 방갈로 예약하기 →
            </Link>
            <button className="btn-outline text-sm px-7 py-3">농장 둘러보기</button>
          </div>

          {/* 통계 */}
          <div className="flex justify-center gap-10 sm:gap-16 mt-16 pt-10 border-t border-forest-500/15">
            {[['6개','방갈로 객실'],['120+','텃밭 구획'],['12종','체험 프로그램']].map(([n,l]) => (
              <div key={l} className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-forest-500">{n}</div>
                <div className="text-xs text-forest-400 font-semibold mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 서비스 카드 ── */}
      <section id="services" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest-900">그라운드팜 예약 서비스</h2>
          <p className="text-forest-500 mt-3 font-light">세 가지 방법으로 자연과 더 가까워지세요</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <div key={s.id} className="card-lift rounded-3xl p-8 relative overflow-hidden border border-transparent hover:border-white/60 hover:shadow-2xl animate-fade-up"
              style={{ background: s.bg, animationDelay: `${i * 0.12}s` }}>
              <span className="absolute top-5 right-6 font-display text-6xl font-bold opacity-10 select-none leading-none"
                style={{ color: s.accent }}>{s.num}</span>
              {s.id === 'bungalow' && (
                <span className="absolute top-4 left-4 bg-wood-600 text-white text-xs font-bold rounded-full px-3 py-1">예약 가능</span>
              )}
              <div className="text-xs font-bold tracking-widest uppercase mb-2 mt-1" style={{ color: s.accent }}>{s.subtitle}</div>
              <h3 className="font-serif text-2xl font-bold mb-4" style={{ color: s.color }}>{s.title}</h3>
              <p className="text-sm text-forest-600/80 leading-relaxed font-light mb-5">{s.desc}</p>
              <div className="mb-7">{s.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}</div>
              {s.id === 'bungalow' ? (
                <Link href="/reserve"
                  className="inline-flex items-center gap-2 text-sm font-bold border-2 rounded-full px-5 py-2.5 transition-all hover:text-white"
                  style={{ borderColor: s.accent, color: s.accent }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.accent }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  지금 예약하기 →
                </Link>
              ) : (
                <button className="inline-flex items-center gap-2 text-sm font-bold border-2 rounded-full px-5 py-2.5 transition-all"
                  style={{ borderColor: s.accent, color: s.accent }}>
                  자세히 보기 →
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 방갈로 목록 ── */}
      <section id="rooms" className="py-20 px-5" style={{ background: 'linear-gradient(160deg,#f0f7f1,#faf8f3)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest-900">방갈로 소개</h2>
            <p className="text-forest-500 mt-3 font-light">1번부터 6번까지, 취향에 맞는 방갈로를 선택하세요</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ROOMS.map((room, i) => (
              <div key={room.id} className="bg-white rounded-2xl p-6 shadow-sm border border-forest-100 card-lift animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{room.icon}</span>
                    <div>
                      <div className="font-bold text-forest-900 text-base">{room.name}</div>
                      <div className="text-xs text-forest-400">{room.capacity}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-forest-500 font-bold text-lg">{room.price.toLocaleString()}원</div>
                    <div className="text-xs text-gray-400">1박 기준</div>
                  </div>
                </div>
                <p className="text-sm text-forest-600/80 font-light mb-5">{room.desc}</p>
                <Link href={`/reserve?room=${room.id}`}
                  className="block w-full text-center bg-forest-500/10 hover:bg-forest-500 hover:text-white text-forest-600 font-bold text-sm rounded-xl py-2.5 transition-all">
                  이 방갈로 예약
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 후기 ── */}
      <section className="py-24 px-5" style={{ background: 'linear-gradient(160deg,#2d3f2e,#1e2d1f)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest-100">농장 이야기</h2>
            <p className="text-forest-400 mt-3 font-light text-sm">그라운드팜을 다녀간 분들의 이야기</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
                <div className="text-3xl text-forest-400/60 mb-4">"</div>
                <p className="text-forest-200 text-sm leading-relaxed font-light mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                  <div>
                    <div className="text-forest-100 font-bold text-sm">{t.name}</div>
                    <div className="text-forest-500 text-xs mt-0.5">{t.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 text-center bg-sand-50">
        <div className="max-w-lg mx-auto">
          <div className="text-4xl mb-5">🌿</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest-900 leading-snug mb-4">
            자연 속의 하루를<br/>지금 예약하세요
          </h2>
          <p className="text-forest-500 text-sm leading-relaxed font-light mb-10">
            경기도 용인 그라운드팜에서<br/>흙의 온기와 바람 소리, 별빛을 느껴보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/reserve" className="btn-primary text-base px-10 py-4">🏡 방갈로 예약하기 →</Link>
            <Link href="/admin" className="btn-outline text-sm px-7 py-3">⚙️ 관리자</Link>
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="bg-forest-900 py-12 px-5 text-forest-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start gap-8">
          <div>
            <div className="font-display text-xl text-forest-100 mb-2">{SITE.nameEn}</div>
            <div className="text-sm leading-relaxed">
              {SITE.address}<br/>
              📞 {SITE.tel}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/reserve" className="bg-white/10 hover:bg-forest-500 border border-white/15 text-forest-200 rounded-full px-5 py-2 text-sm font-semibold transition-colors">방갈로 예약</Link>
            <Link href="/admin"   className="bg-white/10 hover:bg-forest-500 border border-white/15 text-forest-200 rounded-full px-5 py-2 text-sm font-semibold transition-colors">관리자</Link>
            <a href={`tel:${SITE.tel}`} className="bg-forest-500 hover:bg-forest-600 text-white rounded-full px-5 py-2 text-sm font-bold transition-colors">📞 전화</a>
          </div>
          <div className="text-xs">© 2026 그라운드팜. All rights reserved.</div>
        </div>
      </footer>

      {/* 모바일 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden flex gap-3 p-3 bg-sand-50/97 backdrop-blur-md border-t border-forest-200/60 z-40">
        <Link href="/reserve" className="flex-1 btn-primary !rounded-xl !py-3.5 text-center text-sm">🏡 방갈로 예약하기</Link>
        <a href={`tel:${SITE.tel}`} className="flex-none btn-outline !rounded-xl !py-3.5 !px-4 text-sm">📞</a>
      </div>
      <div className="h-20 sm:hidden"/>
    </div>
  )
}
