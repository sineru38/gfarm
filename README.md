# 🌿 그라운드팜 (Ground Farm) — Next.js SaaS 예약 시스템

**Next.js 14 + Supabase + Stripe** 스택으로 구축된 방갈로 예약 SaaS

---

## 📁 전체 파일 구조

```
groundfarm/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (폰트, 메타데이터)
│   ├── globals.css                 # Tailwind + 공통 스타일
│   ├── page.tsx                    # 메인 랜딩 페이지 (서버 컴포넌트)
│   │
│   ├── auth/
│   │   ├── login/page.tsx          # 로그인 / 회원가입
│   │   └── callback/route.ts       # Supabase OAuth 콜백
│   │
│   ├── reserve/
│   │   └── page.tsx                # 예약 폼 (방 선택 → 정보 입력 → Stripe 결제)
│   │
│   ├── success/
│   │   └── page.tsx                # 결제 성공 페이지
│   │
│   ├── admin/
│   │   └── page.tsx                # 관리자 대시보드 (예약 목록/상태 관리)
│   │
│   └── api/
│       ├── create-checkout/route.ts # Stripe Checkout 세션 생성
│       ├── webhook/route.ts         # Stripe Webhook → Supabase 저장
│       └── reservations/route.ts   # 예약 CRUD API
│
├── components/
│   └── ui/
│       └── Navbar.tsx              # 반응형 네비게이션 (모바일 햄버거)
│
├── lib/
│   ├── constants.ts                # 방갈로 정보, 상태 레이블/색상
│   ├── stripe.ts                   # Stripe 클라이언트
│   └── supabase/
│       ├── client.ts               # 클라이언트 컴포넌트용
│       └── server.ts               # 서버 컴포넌트 / API / 관리자용
│
├── types/
│   └── index.ts                    # TypeScript 타입 정의
│
├── middleware.ts                    # /admin 라우트 인증 보호
├── supabase-schema.sql              # DB 스키마 (Supabase에서 실행)
├── .env.local.example               # 환경변수 예시
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 로컬 시작 가이드 (순서대로)

### 1단계. 프로젝트 설치

```bash
# 이 폴더를 그대로 사용하거나 새 Next.js 프로젝트에 복사
npm install
```

### 2단계. Supabase 설정

1. [https://app.supabase.com](https://app.supabase.com) → 새 프로젝트 생성
2. **SQL Editor** → `supabase-schema.sql` 전체 내용 붙여넣고 실행
3. **Project Settings → API** 에서 키 복사

### 3단계. Stripe 설정

1. [https://dashboard.stripe.com](https://dashboard.stripe.com) → 계정 생성
2. **Products** 메뉴 → 방갈로별 상품 6개 생성 → Price ID 복사
   - 또는 Price ID 없이도 작동 (동적 가격으로 자동 폴백)
3. **Developers → API Keys** 에서 키 복사

### 4단계. 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일에 실제 값 입력
```

### 5단계. 개발 서버 실행

```bash
npm run dev
```

### 6단계. Stripe Webhook 로컬 테스트

```bash
# Stripe CLI 설치 후
stripe login
stripe listen --forward-to localhost:3000/api/webhook
# 출력된 whsec_xxx 를 STRIPE_WEBHOOK_SECRET에 저장
```

---

## 🔑 환경변수 설명

| 변수명 | 설명 | 어디서 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 관리자 키 (서버 전용) | Supabase > Settings > API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 공개 키 | Stripe Dashboard > API Keys |
| `STRIPE_SECRET_KEY` | Stripe 비밀 키 | Stripe Dashboard > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook 서명 비밀키 | stripe listen 실행 시 출력 |
| `STRIPE_PRICE_ROOM_1` ~ `_6` | 방갈로별 Stripe Price ID | Stripe > Products |
| `NEXT_PUBLIC_SITE_URL` | 배포 URL | Vercel 배포 주소 |

---

## 💳 결제 흐름

```
사용자 예약 폼 작성
       ↓
POST /api/create-checkout
  → Stripe 세션 생성 (metadata에 예약 정보 포함)
       ↓
Stripe Checkout 페이지로 리다이렉트
       ↓
결제 완료
       ↓
Stripe Webhook → POST /api/webhook
  → checkout.session.completed 이벤트
  → Supabase reservations 테이블에 INSERT
       ↓
/success?session_id=xxx 리다이렉트
  → 예약 완료 화면
```

---

## 🗄️ Supabase 테이블 구조

### `profiles`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | auth.users FK |
| name | text | 이름 |
| phone | text | 연락처 |
| is_admin | boolean | 관리자 여부 |

### `reservations`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text | 예약 UUID |
| user_id | uuid | 예약자 |
| room_id | integer | 방 번호 (1~6) |
| room_name | text | 방 이름 |
| date | date | 예약 날짜 |
| guests | integer | 방문 인원 |
| name | text | 예약자 이름 |
| phone | text | 연락처 |
| status | text | pending / paid / confirmed / cancelled |
| stripe_session_id | text | Stripe 세션 ID |
| stripe_payment_intent | text | Stripe PI ID |
| total_amount | integer | 결제 금액(원) |

---

## 🌐 Vercel 배포

```bash
# Vercel CLI
npx vercel

# 환경변수는 Vercel Dashboard → Settings → Environment Variables에 동일하게 설정
# 배포 후 Stripe Webhook URL 등록:
# https://your-domain.vercel.app/api/webhook
```

---

## 🔐 관리자 계정 설정

```sql
-- Supabase SQL Editor에서 실행
-- 관리자로 지정할 유저 이메일을 먼저 회원가입 후 아래 실행
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
```

---

## 📱 주요 기능

- ✅ **모바일 퍼스트** 반응형 디자인
- ✅ **Supabase Auth** 이메일 로그인 / 회원가입
- ✅ **1~6번 방갈로** 선택 + 날짜 중복 체크
- ✅ **Stripe Checkout** 카드 결제 (KRW)
- ✅ **Webhook** 자동 예약 저장 (결제 완료 시)
- ✅ **관리자 대시보드** 예약 목록 / 상태 변경 / 삭제
- ✅ **RLS** Row Level Security (본인 예약만 접근)
- ✅ **미들웨어** /admin 인증 보호
