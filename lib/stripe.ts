import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// 방 ID → Stripe Price ID 매핑
export function getStripePriceId(roomId: number): string {
  const key = `STRIPE_PRICE_ROOM_${roomId}` as keyof NodeJS.ProcessEnv
  const priceId = process.env[key]
  if (!priceId) throw new Error(`Stripe Price ID not set for room ${roomId}. Check .env.local`)
  return priceId
}
