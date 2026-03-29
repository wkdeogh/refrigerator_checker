# Refrigerator Checker 프로젝트 구조 분석

## 1) 프로젝트 한눈에 보기

이 저장소는 **Next.js 16(App Router) + Supabase(PostgreSQL)** 기반의 모바일 우선 웹 앱이며, 기능적으로는 냉장고 식품의 소비기한을 등록/조회/삭제하는 MVP에 집중되어 있습니다.

- 렌더링 축: `app/page.tsx`의 서버 컴포넌트 중심 렌더링
- 변경 축: `app/actions.ts`의 Server Action으로 CUD 처리
- 데이터 축: `lib/food-repository.ts`를 통해 `food_items` 테이블 접근
- 보안 축: `proxy.ts`의 전역 Basic Auth 게이트 + 서버 전용 Supabase 키 사용

핵심 특징은 "**UI -> Server Action -> Repository -> Supabase**"의 단순하고 명확한 수직 구조입니다.

---

## 2) 디렉터리/파일 구조

분석 시점의 핵심 구조는 아래와 같습니다.

```text
refrigerator_checker/
├─ app/
│  ├─ actions.ts         # Server Actions (등록/삭제)
│  ├─ globals.css        # Tailwind v4 import + 글로벌 스타일
│  ├─ layout.tsx         # 루트 레이아웃/메타데이터
│  └─ page.tsx           # 메인 화면(조회/폼/목록 렌더링)
├─ lib/
│  ├─ food-repository.ts # DB 접근 계층
│  └─ supabase-server.ts # 서버 전용 Supabase 클라이언트 팩토리
├─ supabase/
│  └─ schema.sql         # food_items 테이블/인덱스 정의
├─ types/
│  └─ food.ts            # FoodItem 타입
├─ public/               # 기본 정적 아이콘 자산
├─ proxy.ts              # 앱 전역 Basic Auth 처리
├─ package.json          # 런타임/빌드 의존성 및 스크립트
├─ next.config.ts        # Next 설정(현재 기본값)
├─ tsconfig.json         # TS 엄격 모드 + @/* alias
├─ eslint.config.mjs     # next/core-web-vitals + typescript
├─ postcss.config.mjs    # Tailwind v4 PostCSS 플러그인
├─ .env.example          # 필수 환경 변수 템플릿
└─ README.md             # 제품/운영 가이드
```

---

## 3) 런타임 아키텍처

### 3.1 요청 및 렌더링 흐름

1. 사용자가 `/` 접근
2. `proxy.ts`가 Basic Auth 검사
3. 통과 시 `app/page.tsx` 서버 컴포넌트 실행
4. `listFoods()` 호출로 Supabase 조회
5. 응답 데이터를 소비기한 오름차순으로 렌더링

`app/page.tsx`는 `export const dynamic = "force-dynamic"`를 사용해 정적 캐싱 대신 요청 시점 렌더를 강제합니다. 따라서 데이터 갱신 반영이 즉시성에 가깝습니다.

### 3.2 변경(등록/삭제) 흐름

1. 폼 submit -> `createFoodAction` 또는 `removeFoodAction`
2. 입력 검증(`actions.ts`) 수행
3. `food-repository.ts`에서 DB 반영
4. `revalidatePath("/")`로 목록 페이지 재검증

API Route를 별도로 두지 않고, App Router의 Server Action으로 직접 처리하는 구조입니다.

---

## 4) 계층별 상세 분석

## 4.1 프레젠테이션 계층 (`app/`)

### `app/layout.tsx`
- 문서 메타데이터(title/description) 정의
- `lang="ko"` 지정
- `Geist`, `Geist_Mono` 폰트를 CSS 변수로 주입

### `app/page.tsx`
- 앱의 핵심 화면(등록 폼 + 목록 + 삭제 버튼)
- `getDaysLeft()`로 Asia/Seoul 기준 남은 일수 계산
- `getStatusLabel()`로 상태 배지 톤 분기
  - `< 0`: 지남(빨강)
  - `= 0`: 오늘까지(빨강)
  - `1~3`: 임박(주황)
  - `>=4`: 여유(초록)
- 목록 비어있을 때 empty state 제공

### `app/actions.ts`
- `"use server"` 선언으로 서버 전용 액션
- `normalizeDateInput()`에서 `YYYY-MM-DD` 형식 + 실제 달력 날짜 유효성 검증
- 이름 길이(<=40) 검증이 DB 제약과 정합
- 성공 시 `revalidatePath("/")`

## 4.2 데이터 접근 계층 (`lib/`)

### `lib/supabase-server.ts`
- 환경 변수 강제 확인(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- `createClient` 생성 시 세션 지속/토큰 자동 갱신 비활성화
- 서버 컨텍스트 전용 클라이언트 팩토리 역할

### `lib/food-repository.ts`
- `listFoods()`: `expires_on ASC`, `created_at ASC` 다중 정렬
- `addFood()`: name/expires_on insert
- `removeFood()`: id로 delete
- Supabase 오류를 도메인 에러 문자열로 래핑

## 4.3 타입 계층 (`types/`)

### `types/food.ts`
- DB 응답 형태를 `FoodItem`으로 고정
- UI/리포지토리 간 공통 계약 역할

## 4.4 데이터베이스 계층 (`supabase/schema.sql`)

- `food_items` 테이블
  - `id uuid` (PK, `gen_random_uuid()`)
  - `name text not null` + 길이 체크(1~40)
  - `expires_on date not null`
  - `created_at timestamptz not null default now()`
- `expires_on` 인덱스 존재 -> 임박 순 조회 쿼리 최적화 기반

## 4.5 접근 제어 계층 (`proxy.ts`)

- 전역 matcher로 정적 자산 일부를 제외한 모든 요청 가드
- 동작 규칙이 명확함
  - 사용자/비밀번호 모두 미설정: 인증 우회
  - 둘 중 하나만 설정: 모두 차단(401)
  - 둘 다 설정: Basic Auth 필수
- 내부/가족용 앱을 염두에 둔 단순 운영 보안 전략

---

## 5) 설정 및 도구 체인 분석

### `package.json`
- 런타임: Next 16.2.1, React 19.2.4, Supabase JS 2.x
- 개발: TypeScript 5, ESLint 9, Tailwind 4
- 스크립트: `dev`, `build`, `start`, `lint`

### `tsconfig.json`
- `strict: true`, `moduleResolution: bundler`
- 경로 별칭 `@/* -> ./*`

### `eslint.config.mjs`
- `eslint-config-next/core-web-vitals` + `typescript` 프리셋
- `.next`, `out`, `build` 등 무시

### `postcss.config.mjs`
- `@tailwindcss/postcss`만 사용하는 최소 구성

---

## 6) 의존 관계(개념도)

```text
app/page.tsx
  ├─ imports app/actions.ts (form action target)
  ├─ imports lib/food-repository.ts (listFoods)
  └─ imports types/food.ts (FoodItem)

app/actions.ts
  └─ imports lib/food-repository.ts (addFood/removeFood)

lib/food-repository.ts
  ├─ imports lib/supabase-server.ts
  └─ imports types/food.ts

lib/supabase-server.ts
  └─ imports @supabase/supabase-js

proxy.ts
  └─ imports next/server
```

구조적으로 순환 참조는 없고, `app -> lib -> infra` 단방향 의존이 유지됩니다.

---

## 7) 현재 구조의 강점

- 파일 수가 적고 책임 분리가 분명해 온보딩 난이도가 낮음
- 입력 검증(서버) + DB 제약(스키마)이 이중으로 안전망 구성
- 정렬 기준(`expires_on`, `created_at`)이 UX 기대와 일치
- 환경 변수 누락 시 즉시 실패(fail-fast) 전략
- Basic Auth를 앱 전체에 공통 적용 가능

---

## 8) 관찰된 리스크/개선 여지

1. **서비스 롤 키 사용 범위**
   - 서버 전용이라 보안상 치명적 문제는 아니지만, 서비스 롤은 권한이 매우 큼
   - 장기적으로는 RLS + 제한 권한 키 조합이 운영상 더 안전

2. **액션 에러 처리 UX**
   - `throw Error` 중심이라 사용자 친화적 에러 표시가 제한될 수 있음
   - `useActionState`/에러 바운더리 등으로 폼 레벨 피드백 강화 가능

3. **스타일 일관성**
   - `layout.tsx`에서 Geist를 주입하지만 `globals.css`의 body는 Arial 우선
   - 의도한 타이포그래피가 반영되지 않을 가능성 존재

4. **테스트 부재**
   - 날짜 계산, 검증 로직(`normalizeDateInput`)은 단위 테스트 가치가 높음

5. **기능 확장 대비 구조**
   - 현재 MVP엔 적합하지만 인증/카테고리/알림 확장 시
   - 서버 액션, repository, UI 상태를 더 세분화할 필요가 생길 수 있음

---

## 9) 결론

이 프로젝트는 작은 범위의 제품 목표에 맞춰 **아주 직선적인 구조**를 채택하고 있습니다. 복잡한 추상화 없이 Server Action과 Repository를 연결해 CRUD를 빠르게 구현했고, DB 정렬/검증/인덱스가 현재 요구사항과 잘 맞물려 있습니다.

즉, "지금 필요한 기능을 안정적으로 제공하는 MVP 아키텍처"로는 적합하며, 이후 기능 확장(권한 모델 고도화, 사용자 피드백 UX, 테스트 체계) 단계에서 계층을 점진적으로 확장하는 전략이 가장 자연스럽습니다.
