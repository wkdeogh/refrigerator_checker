# Refrigerator Checker

우리집 냉장고 식품의 소비기한을 등록하고, **임박한 순서(오름차순)** 로 보여주는 모바일 우선 웹 앱입니다.

## 현재 구현 범위 (MVP)

- 식품 이름 + 소비기한 등록
- 소비기한 임박 순 정렬 목록
- 남은 일수(오늘까지 / N일 남음 / N일 지남) 표시
- 항목 삭제
- 서버 저장(Supabase PostgreSQL)

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Vercel 배포

## Supabase 테이블 생성

`supabase/schema.sql` 내용을 Supabase SQL Editor에서 실행하세요.

## 환경 변수

`.env.example`을 참고해 `.env.local` 파일을 만드세요.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASIC_AUTH_USER=
APP_BASIC_AUTH_PASSWORD=
```

> `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 키이므로 절대 클라이언트 코드에서 사용하면 안 됩니다.
>
> `APP_BASIC_AUTH_USER`, `APP_BASIC_AUTH_PASSWORD`를 설정하면 앱 전체에 Basic Auth가 걸려서 가족 외 접근을 막을 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## Vercel 배포

1. Git 저장소를 Vercel 프로젝트로 연결
2. Environment Variables에 `.env.local`과 동일한 값 등록
3. Deploy

## 날짜 계산 기준

소비기한 잔여일 계산은 `Asia/Seoul` 기준으로 처리됩니다.

## 다음 단계 제안

- (선택) 2인 전용 로그인 추가 (Supabase Auth)
- (선택) 소비기한 임박 푸시/알림 기능
- (선택) 카테고리(유제품/육류/채소) 필터
