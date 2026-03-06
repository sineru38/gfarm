import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminSupabase()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date   = searchParams.get('date')

    let query = supabase.from('reservations').select('*').order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    if (date) query = query.eq('date', date)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ reservations: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    const supabase = createAdminSupabase()
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
