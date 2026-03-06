import type { Room } from '@/types'

export const ROOMS: Room[] = [
  { id: 1, name: '1번 방갈로', capacity: '최대 2인', icon: '🌲', desc: '숲속 조용한 커플 방갈로', price: 80000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_1' },
  { id: 2, name: '2번 방갈로', capacity: '최대 4인', icon: '🌿', desc: '가족과 함께하는 편안한 공간', price: 120000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_2' },
  { id: 3, name: '3번 방갈로', capacity: '최대 4인', icon: '🌾', desc: '들판이 보이는 전망 방갈로', price: 130000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_3' },
  { id: 4, name: '4번 방갈로', capacity: '최대 6인', icon: '🌕', desc: '달빛 아래 넓은 가족 방갈로', price: 160000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_4' },
  { id: 5, name: '5번 방갈로', capacity: '최대 6인', icon: '⭐', desc: '별빛 테라스가 있는 프리미엄', price: 180000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_5' },
  { id: 6, name: '6번 방갈로', capacity: '최대 8인', icon: '🏕️', desc: '단체 모임을 위한 대형 방갈로', price: 220000, stripePriceEnvKey: 'STRIPE_PRICE_ROOM_6' },
]

export const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r])) as Record<number, Room>

export const STATUS_LABEL: Record<string, string> = {
  pending:   '결제 대기',
  paid:      '결제 완료',
  confirmed: '예약 확정',
  cancelled: '취소됨',
}

export const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: '#fff8e1', text: '#f59e0b', border: '#fcd34d' },
  paid:      { bg: '#eff6ff', text: '#3b82f6', border: '#93c5fd' },
  confirmed: { bg: '#e8f5e9', text: '#16a34a', border: '#86efac' },
  cancelled: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
}

export const SITE = {
  name:    '그라운드팜',
  nameEn:  'Ground Farm',
  tagline: '땅과 가까워지는 나만의 쉼표',
  address: '경기도 용인시 처인구 남사읍 전궁로 95번길 89',
  tel:     '1800-5171',
  email:   'groundfarm@example.com',
}
