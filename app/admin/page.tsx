"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// 데이터 구조 정의 (장부 항목들)
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
  const supabase = createClient()

  // 1. 장부 데이터 불러오기 함수
  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setReservations(data as Reservation[])
    setLoading(false)
  }

  // 2. 입금 확인 처리 함수
  async function confirmPayment(id: string) {
    const { error } = await supabase
      .from('reservations')
      .update({ payment_status: 'paid' })
      .eq('id', id)
    
    if (!error) {
      alert('입금 확인 처리가 완료되었습니다!')
      loadData()
    }
  }

  // 3. 예약 삭제 함수
  async function deleteData(id: string) {
    if(!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('reservations').delete().eq('id', id)
    loadData()
  }

  // 페이지 접속 시 데이터 로드
  useEffect(() => { loadData() }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 상단 헤더 영역 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🚜 방갈로 예약 관리 장부</h1>
          <div className="flex gap-2">
            <Link href="/" className="bg-white px-4 py-2 rounded-lg text-sm border shadow-sm">홈으로</Link>
            <button onClick={() => loadData()} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-md">새로고침 🔄</button>
          </div>
        </div>

        {/* 대시보드 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500 font-bold mb-1">전체</div>
            <div className="text-xl font-bold">{reservations.length}건</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs text-amber-500 font-bold mb-1">대기</div>
            <div className="text-xl font-bold text-amber-500">
              {reservations.filter(r => r.payment_status !== 'paid').length}건
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs text-blue-500 font-bold mb-1">완료</div>
            <div className="text-xl font-bold text-blue-500">
              {reservations.filter(r => r.payment_status === 'paid').length}건
            </div>
          </div>
        </div>

        {/* 예약 리스트 영역 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">장부를 가져오고 있습니다...</div>
          ) : reservations.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">{r.bungalow_number}호</span>
                  <span className="font-bold text-lg">{r.guest_name}님</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.payment_status === 'paid' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {r.payment_status === 'paid' ? '입금완료' : '입금대기'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  📅 {r.booking_date} ({r.booking_time}) | 📞 {r.guest_phone}
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {r.payment_status !== 'paid' && (
                  <button onClick={() => confirmPayment(r.id)} className="flex-1 sm:flex-none bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold">확인</button>
                )}
                <button onClick={() => deleteData(r.id)} className="flex-1 sm:flex-none bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold border border-red-100">삭제</button>
              </div>
            </div>
          ))}
          {reservations.length === 0 && !loading && (
            <div className="bg-white p-10 rounded-2xl text-center text-gray-400 border border-dashed border-gray-300">
              아직 들어온 예약 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
