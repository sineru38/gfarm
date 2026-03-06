"use client"
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { ROOMS, SITE } from '@/lib/constants'

// 서비스 데이터 (기존 유지)
const SERVICES = [
  { id: 'garden',   title: '텃밭 분양',     subtitle: 'My Little Garden', desc: '나만의 텃밭을 분양받아 직접 채소와 허브를 키워보세요.', tags: ['연간 계약'], color: '#3d6b4f', bg: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', accent: '#2e7d32', num: '01' },
  { id: 'bungalow', title: '방갈로 대여',   subtitle: 'Stay & Breathe',   desc: '9시부터 18시까지, 1시간 단위로 즐기는 숲속 휴식.',                            tags: ['6개 방갈로', '시간당 1만원'], color: '#6d4c2a', bg: 'linear-gradient(135deg,#fdf3e7,#f5dfc0)', accent: '#a1590f', num: '02' },
  { id: 'program',  title: '체험 프로그램', subtitle: 'Hands-on Nature',  desc: '가족과 함께하는 계절별 자연 체험 프로그램.',                          tags: ['주말 운영'], color: '#4a6741', bg: 'linear-gradient(135deg,#f1f8e9,#dcedc8)', accent: '#558b2f', num: '03' },
]

export default function HomePage() {
  // --- 테스트용 예약 상태 관리 ---
  const [booking, setBooking] = useState({
    room: '',
    date: '',
    time: '',
    name: '',
    phone: ''
  });

const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 로딩 시작 (중복 클릭 방지)
    console.log("데이터 전송 시작...");

    // 2. 슈파베이스와 대화할 '비서(client)'를 소환합니다.
    const supabase = createClient();

    // 3. 장부(reservations 테이블)에 손님이 입력한 정보를 집어넣습니다.
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { 
          bungalow_number: parseInt(booking.room.replace('호', '')), // "1호" -> 1 (숫자로 변환)
          booking_date: booking.date,
          booking_time: booking.time,
          guest_name: booking.name,
          guest_phone: booking.phone,
          payment_status: 'pending' // 아직 돈은 안 냈으니 '대기중'
        }
      ]);

    // 4. 결과 보고
    if (error) {
      console.error('장부 기록 실패:', error.message);
      alert('에러가 발생했어요: ' + error.message);
    } else {
      console.log('기록 성공:', data);
      alert('축하합니다! 사장님의 슈파베이스 장부에 예약 정보가 실시간으로 기록되었습니다.');
    }
  };

  return (
    <div className="bg-sand-50 min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#f0f7f1 0%,#e8f0e0 45%,#f5efe6 100%)' }}>
        <div className="relative z-10 text-center max-w-2xl mx-auto px-5">
          <div className="inline-flex items-center gap-2 bg-forest-100 border border-forest-300 text-forest-700 rounded-full px-4 py-1.5 text-xs font-bold mb-7">
            🌿 1시간 단위 감성 방갈로 오픈
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-forest-900 mb-4">
            시간을 빌리는<br/>
            <em className="text-forest-500 not-italic">숲속 방갈로</em>
          </h1>
          <p className="text-forest-600 text-base mb-10">
            원하는 시간에 딱 1시간만, 10,000원으로 즐기는 프라이빗 휴식
          </p>
          <a href="#reserve-section" className="btn-primary text-base px-10 py-4">
            지금 바로 예약하기 ↓
          </a>
        </div>
      </section>

      {/* ── 핵심: 방갈로 6개 리스트 & 예약 폼 ── */}
      <section id="reserve-section" className="py-20 px-5 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* 왼쪽: 방갈로 선택 (6개) */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-bold text-forest-900 mb-6">1. 방갈로 선택 (6개실)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setBooking({...booking, room: `${num}호`})}
                  className={`p-6 rounded-2xl border-2 transition-all text-center ${
                    booking.room === `${num}호` 
                    ? 'border-forest-500 bg-forest-50 shadow-md' 
                    : 'border-gray-100 bg-white hover:border-forest-200'
                  }`}
                >
                  <span className="text-3xl mb-2 block">🏠</span>
                  <div className="font-bold text-forest-900">{num}호 방갈로</div>
                  <div className="text-xs text-forest-500 mt-1">10,000원 / 1시간</div>
                </button>
              ))}
            </div>
          </div>

          {/* 오른쪽: 예약 정보 입력 */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-forest-100 h-fit">
            <h2 className="font-display text-xl font-bold text-forest-900 mb-6">2. 예약 정보 입력</h2>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-forest-400 mb-1">예약 날짜</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                  onChange={(e) => setBooking({...booking, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-forest-400 mb-1">예약 시간 (9시~18시)</label>
                <select 
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                  onChange={(e) => setBooking({...booking, time: e.target.value})}
                >
                  <option value="">시간 선택</option>
                  {[9,10,11,12,13,14,15,16,17].map(h => (
                    <option key={h} value={`${h}:00`}>{h}:00 ~ {h+1}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-forest-400 mb-1">예약자 성함</label>
                <input 
                  type="text" 
                  placeholder="성함을 입력하세요"
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                  onChange={(e) => setBooking({...booking, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-forest-400 mb-1">연락처</label>
                <input 
                  type="tel" 
                  placeholder="010-0000-0000"
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                  onChange={(e) => setBooking({...booking, phone: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-dashed mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 text-sm">총 결제 금액</span>
                  <span className="text-forest-600 font-bold text-xl">10,000원</span>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-forest-500 text-white font-bold py-4 rounded-2xl hover:bg-forest-600 transition-all shadow-lg"
                >
                  💳 결제 및 예약하기
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 푸터 (기존 유지) */}
      <footer className="bg-forest-900 py-12 px-5 text-forest-400 text-center">
        <div className="text-xs">© 2026 그라운드팜. 1시간 단위 방갈로 대여 서비스 테스트 중</div>
      </footer>
    </div>
  )
}