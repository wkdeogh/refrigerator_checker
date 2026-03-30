# Refrigerator Checker 프로젝트 리서치

## 개요

이 프로젝트는 `Next.js 16` App Router와 `Supabase(PostgreSQL)`를 사용한 냉장고 소비기한 관리 앱이다. 범위는 작고 명확하며, 식품 등록/조회/삭제와 소비기한 달력 확인에 집중한다.

핵심 구조는 다음과 같다.

- 화면 렌더링: `app/page.tsx`, `app/calendar/page.tsx`
- 변경 처리: `app/actions.ts`
- 데이터 접근: `lib/food-repository.ts`
- 서버 클라이언트: `lib/supabase-server.ts`
- 접근 제어: `proxy.ts`
- 스키마: `supabase/schema.sql`

전체적으로 `UI -> Server Action -> Repository -> Supabase`로 이어지는 단순한 수직 구조다.

## 프로젝트 구성

```text
app/
  layout.tsx
  globals.css
  page.tsx
  calendar/page.tsx
  actions.ts
  _components/
    bottom-tab-bar.tsx
    form-submit-button.tsx
lib/
  supabase-server.ts
  food-repository.ts
supabase/
  schema.sql
types/
  food.ts
proxy.ts
```

## 실행/의존성

`package.json` 기준 주요 의존성은 다음과 같다.

- `next@16.2.1`
- `react@19.2.4`
- `react-dom@19.2.4`
- `@supabase/supabase-js`
- `tailwindcss@4`

스크립트는 `dev`, `build`, `start`, `lint`만 있다. 테스트 스크립트는 없다.

## 화면 구조

### `app/page.tsx`

홈 화면은 서버 컴포넌트로 구현되어 있고, 렌더 시 `listFoods()`로 현재 식품을 읽어온다. `export const dynamic = "force-dynamic"`이 있어 정적 캐시보다 요청 시 최신 데이터 반영을 우선한다.

화면은 크게 3개 영역이다.

- 상단 요약 카드
- 등록된 식품 목록
- 식품 등록 폼

목록은 `expires_on` 오름차순, 그 다음 `created_at` 오름차순으로 보여준다. 남은 일수는 `Asia/Seoul` 기준으로 계산하고, 상태는 다음처럼 분기한다.

- 음수: 이미 지난 항목
- 0일: 오늘까지
- 1~3일: 임박
- 4일 이상: 여유

### `app/calendar/page.tsx`

달력 화면도 서버 컴포넌트다. 전체 식품을 불러온 뒤 월별로 그룹화해 소비기한을 달력 형태로 표시한다.

특징은 다음과 같다.

- 서울 시각 기준 오늘 날짜 계산
- 등록된 소비기한이 있는 월만 렌더링
- 월간 달력 그리드 생성
- 특정 날짜에 여러 식품이 있으면 개수 배지로 표시
- 해당 월의 목록을 날짜별로 아래에 다시 나열

이 화면은 단순히 달력만 보여주는 게 아니라, 월별 분포와 실제 목록을 함께 보여준다.

## 변경 흐름

### `app/actions.ts`

등록/삭제는 Server Action으로 처리한다.

`createFoodAction`은 다음을 수행한다.

- `name`, `expiresOn`을 `FormData`에서 읽음
- 이름 공백 제거 및 필수 검증
- 이름 길이 40자 제한 검증
- `YYYY-MM-DD` 형식 검증 및 실제 달력 날짜인지 검증
- `addFood()` 호출
- `/`, `/calendar` 경로 재검증

`removeFoodAction`은 `id`를 읽어 삭제하고 동일하게 두 경로를 재검증한다.

이 구조는 별도 API route 없이 App Router의 서버 액션으로 CRUD를 끝내는 방식이다.

## 데이터 계층

### `lib/supabase-server.ts`

서버에서만 사용하는 Supabase 클라이언트를 만든다. `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 없으면 즉시 에러를 던지는 fail-fast 방식이다.

세션 자동 갱신과 지속 저장은 꺼져 있어 서버 요청용 클라이언트 성격이 분명하다.

### `lib/food-repository.ts`

리포지토리 계층은 3개 함수만 가진다.

- `listFoods()`
- `addFood()`
- `removeFood()`

역할이 단순하고, Supabase 응답 오류를 도메인 에러 메시지로 래핑한다. 이 파일이 실제 DB 접근의 유일한 진입점이다.

## 스키마

### `supabase/schema.sql`

테이블 `public.food_items`는 다음 구조다.

- `id uuid primary key default gen_random_uuid()`
- `name text not null check (char_length(name) between 1 and 40)`
- `expires_on date not null`
- `created_at timestamptz not null default now()`

추가로 `expires_on` 인덱스가 있어 임박 순 조회에 유리하다.

## 타입

### `types/food.ts`

`FoodItem` 타입은 DB 조회 결과와 UI 사이의 공통 계약이다.

- `id`
- `name`
- `expires_on`
- `created_at`

## 인증/보안

### `proxy.ts`

앱 전역 요청을 Basic Auth로 감싼다. 규칙은 다음과 같다.

- `APP_BASIC_AUTH_USER`와 `APP_BASIC_AUTH_PASSWORD`가 둘 다 없으면 인증 생략
- 둘 중 하나만 있으면 401
- 둘 다 있으면 Basic Auth 검증

`/`, `/calendar`뿐 아니라 대부분의 요청이 이 게이트를 통과해야 한다. 정적 자산 일부만 예외 처리한다.

### 보안상 특징

- Supabase 서비스 롤 키는 서버 전용으로만 사용
- 클라이언트 측 비밀키 노출 없음
- 내부/가족용 앱 성격에 맞는 단순한 접근 제어

## 스타일/UX

### `app/_components/form-submit-button.tsx`

`useFormStatus()`를 사용해 서버 액션 제출 중 상태를 표시한다. 버튼 비활성화와 로딩 스피너가 함께 동작한다.

### `app/_components/bottom-tab-bar.tsx`

하단 탭은 홈/달력 두 개로 구성된다. `usePathname()`으로 현재 위치를 확인해 활성 탭 스타일을 바꾼다. 모바일 하단 내비게이션에 맞춘 고정형 UI다.

### `app/globals.css`

Tailwind v4를 사용하고, 전역 배경/전경색만 최소한으로 정의한다. 전체적으로 유틸리티 클래스 중심의 스타일링이다.

## 기술적 관찰

- 서버 컴포넌트와 Server Action 조합이 전체 구조의 중심이다.
- 데이터 갱신은 `revalidatePath()`로 처리한다.
- 날짜 계산은 브라우저 로케일이 아니라 `Asia/Seoul` 기준으로 고정한다.
- 실제 캘린더 날짜 검증이 들어가 있어 잘못된 `YYYY-MM-DD`를 막는다.
- 전체 코드 규모가 작아 추상화 과잉이 없다.

## 강점

- 구조가 단순해서 유지보수가 쉽다.
- UI/서버/DB 책임이 잘 나뉜다.
- 스키마 제약과 서버 검증이 중복으로 안전하다.
- 소비기한 정렬이 제품 목적과 정확히 맞는다.
- 모바일 우선 UX가 명확하다.

## 리스크

- 서비스 롤 키 사용 범위가 넓어 운영 보안은 강하지만 권한 자체는 크다.
- 사용자 친화적 에러 표시는 아직 단순하다.
- 테스트 코드가 없어 날짜 계산과 입력 검증 회귀를 잡기 어렵다.
- `proxy.ts`의 Basic Auth는 간단하지만 조직/권한 모델이 커지면 한계가 있다.

## 결론

이 프로젝트는 냉장고 소비기한 관리라는 좁은 문제를 위해 필요한 것만 구현한 MVP다. 현재 상태의 가장 큰 장점은 구조가 직선적이고 이해하기 쉽다는 점이며, 다음 확장은 사용자 인증, 테스트, 알림, 카테고리화 순으로 자연스럽다.
