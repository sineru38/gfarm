'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user,       setUser]       = useState<User | null>(null)
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => { subscription.unsubscribe(); window.removeEventListener('scroll', onScroll) }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  const navLinks = [
    { label: '방갈로 예약', href: '/reserve' },
    { label: '텃밭 분양',   href: '/#garden' },
    { label: '체험 프로그램', href: '/#program' },
    { label: '농장 소개',   href: '/#about' },
  ]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 transition-all duration-300
        ${scrolled ? 'bg-sand-50/95 backdrop-blur-md border-b border-forest-500/10 shadow-sm' : 'bg-transparent'}`}>
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <svg viewBox="0 0 36 36" width="28" height="28">
            <circle cx="18" cy="18" r="17" fill="#e8f5e9" stroke="#4a7c59" strokeWidth="1.5"/>
            <path d="M18 28 C18 18,10 12,6 10 C12 16,16 22,18 28Z" fill="#66bb6a"/>
            <path d="M18 28 C18 16,26 10,30 8 C24 16,20 22,18 28Z" fill="#43a047"/>
            <circle cx="18" cy="10" r="3" fill="#ffe082"/>
          </svg>
          <span className="font-display font-bold text-xl text-forest-800 tracking-wide hidden sm:block">
            Ground Farm
          </span>
        </Link>

        {/* PC 메뉴 */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="relative text-forest-700 text-sm font-semibold tracking-wide group">
              {l.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-forest-500 transition-all group-hover:w-full"/>
            </Link>
          ))}
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/admin" className="hidden sm:flex items-center gap-1 text-xs text-forest-600 font-semibold border border-forest-300 rounded-full px-3 py-1.5 hover:bg-forest-100 transition-colors">
                ⚙️ 관리자
              </Link>
              <button onClick={handleLogout}
                className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/auth/login"
              className="text-xs text-forest-600 border border-forest-300 rounded-full px-4 py-1.5 font-semibold hover:bg-forest-100 transition-colors">
              로그인
            </Link>
          )}
          <Link href="/reserve"
            className="btn-primary !py-2 !px-5 !text-sm !rounded-full">
            예약하기
          </Link>
          {/* 모바일 햄버거 */}
          <button className="md:hidden p-1.5 text-forest-800" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* 모바일 드롭다운 */}
      {mobileOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-sand-50/98 backdrop-blur-md border-b border-forest-200 animate-slide-down md:hidden">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-5 py-4 text-base font-semibold text-forest-800 border-b border-forest-100/50 active:bg-forest-100">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-5 py-4 text-base font-semibold text-forest-600 border-b border-forest-100/50">⚙️ 관리자</Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="block w-full text-left px-5 py-4 text-base font-semibold text-gray-500">로그아웃</button>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-5 py-4 text-base font-semibold text-forest-600">로그인 / 회원가입</Link>
          )}
        </div>
      )}
    </>
  )
}
