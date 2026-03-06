'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [tab,      setTab]      = useState<'login'|'signup'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const supabase = createClient()
  const router   = useRouter()

  async function handleLogin() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/reserve')
  }

  async function handleSignup() {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    // profile 업데이트
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, name, phone })
    }
    setSuccess('가입 확인 이메일을 발송했습니다. 이메일을 확인해 주세요!')
    setLoading(false)
  }

  const inp = "input-field"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg,#f0f7f1,#e6eedd,#f5efe6)' }}>
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg viewBox="0 0 36 36" width="36" height="36">
              <circle cx="18" cy="18" r="17" fill="#e8f5e9" stroke="#4a7c59" strokeWidth="1.5"/>
              <path d="M18 28 C18 18,10 12,6 10 C12 16,16 22,18 28Z" fill="#66bb6a"/>
              <path d="M18 28 C18 16,26 10,30 8 C24 16,20 22,18 28Z" fill="#43a047"/>
              <circle cx="18" cy="10" r="3" fill="#ffe082"/>
            </svg>
            <span className="font-display text-2xl font-bold text-forest-900">Ground Farm</span>
          </Link>
          <p className="text-forest-500 text-sm mt-2 font-light">자연과 함께하는 하루를 예약하세요</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* 탭 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {(['login','signup'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-forest-500 text-white shadow-sm' : 'text-gray-400'}`}>
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">✉️</div>
              <p className="text-forest-700 font-semibold mb-2">이메일을 확인해 주세요</p>
              <p className="text-sm text-gray-500">{success}</p>
              <button onClick={() => { setSuccess(''); setTab('login') }}
                className="mt-6 text-forest-500 font-semibold text-sm underline">
                로그인으로 이동
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tab === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">이름 *</label>
                    <input className={inp} type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)}/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">연락처 *</label>
                    <input className={inp} type="tel" placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)}/>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">이메일 *</label>
                <input className={inp} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">비밀번호 *</label>
                <input className={inp} type="password" placeholder="8자 이상" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleSignup())}/>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-semibold">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={tab === 'login' ? handleLogin : handleSignup}
                disabled={loading}
                className="btn-primary w-full !rounded-xl !py-4 text-base mt-2">
                {loading ? '처리 중...' : tab === 'login' ? '로그인' : '회원가입'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          <Link href="/" className="text-forest-500 font-semibold">← 메인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  )
}
