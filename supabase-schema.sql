-- ══════════════════════════════════════════════
-- Supabase SQL Schema  (Supabase → SQL Editor에서 실행)
-- ══════════════════════════════════════════════

-- 1. profiles 테이블 (auth.users 확장)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text,
  phone       text,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

-- 새 유저 가입 시 자동으로 profile 행 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. reservations 테이블
create table if not exists public.reservations (
  id                    text primary key default gen_random_uuid()::text,
  user_id               uuid references auth.users(id) on delete set null,
  room_id               integer not null check (room_id between 1 and 6),
  room_name             text not null,
  date                  date not null,
  guests                integer not null default 1,
  name                  text not null,
  phone                 text not null,
  status                text not null default 'pending'
                          check (status in ('pending','paid','confirmed','cancelled')),
  stripe_session_id     text,
  stripe_payment_intent text,
  total_amount          integer not null default 0,  -- 원화 (KRW)
  created_at            timestamptz default now()
);

-- 인덱스
create index if not exists idx_reservations_user    on public.reservations(user_id);
create index if not exists idx_reservations_date    on public.reservations(date);
create index if not exists idx_reservations_room    on public.reservations(room_id, date);
create index if not exists idx_reservations_status  on public.reservations(status);
create index if not exists idx_reservations_session on public.reservations(stripe_session_id);

-- 3. RLS (Row Level Security)
alter table public.profiles     enable row level security;
alter table public.reservations enable row level security;

-- profiles: 본인만 읽기/쓰기, 관리자는 전체
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- reservations: 본인 예약 읽기
create policy "reservations_self_read" on public.reservations
  for select using (auth.uid() = user_id);

-- reservations: 로그인 유저만 INSERT
create policy "reservations_insert" on public.reservations
  for insert with check (auth.uid() = user_id);

-- reservations: 관리자 전체 접근 (service role bypasses RLS)
-- → webhook이 service role key로 접근하므로 자동 허용

-- 4. 예약 날짜 중복 체크 함수
create or replace function public.check_room_available(
  p_room_id integer,
  p_date    date
) returns boolean as $$
  select not exists (
    select 1 from public.reservations
    where room_id = p_room_id
      and date = p_date
      and status in ('pending','paid','confirmed')
  );
$$ language sql stable;
