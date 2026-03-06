// types/index.ts

export type RoomId = 1 | 2 | 3 | 4 | 5 | 6

export interface Room {
  id: RoomId
  name: string
  capacity: string
  icon: string
  desc: string
  price: number        // 1일 기준 원화
  stripePriceEnvKey: string
}

export type ReservationStatus = 'pending' | 'paid' | 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  user_id: string
  room_id: RoomId
  room_name: string
  date: string           // YYYY-MM-DD
  guests: number
  name: string
  phone: string
  status: ReservationStatus
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  total_amount: number
  created_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  is_admin?: boolean
}
