# Refrigerator Checker 배포 가이드

이 문서는 이 프로젝트를 **처음부터 실제 서비스 URL까지** 올리는 과정을, 초보자도 따라할 수 있게 단계별로 설명합니다.

진행 순서:

1. 로컬 준비
2. Supabase 프로젝트 생성 + DB 테이블 만들기
3. 로컬 환경 변수 설정
4. 로컬 실행으로 동작 확인
5. GitHub 업로드
6. Vercel 배포
7. 배포 후 점검
8. 자주 막히는 문제 해결

---

## 0) 시작 전에 준비물

- Node.js 20 이상
- npm
- GitHub 계정
- Supabase 계정
- Vercel 계정

확인 명령어:

```bash
node -v
npm -v
git --version
```

---

## 1) 로컬 프로젝트 준비

이미 이 저장소를 갖고 있다면 이 단계는 건너뛰어도 됩니다.

```bash
git clone <YOUR_REPOSITORY_URL>
cd refrigerator_checker
npm install
```

---

## 2) Supabase 설정 (DB 준비)

이 프로젝트는 데이터 저장을 Supabase PostgreSQL에 합니다.

## 2-1. Supabase 프로젝트 생성

1. https://supabase.com 로그인
2. `New project` 클릭
3. 아래 값 입력
   - Organization: 본인 조직 선택
   - Name: 예) `refrigerator-checker`
   - Database Password: 강한 비밀번호 설정(반드시 저장)
   - Region: 사용자와 가까운 지역(예: Northeast Asia)
4. `Create new project` 클릭
5. 프로젝트 생성 완료까지 대기(보통 1~2분)

## 2-2. DB 스키마 적용 (`food_items` 테이블 생성)

1. Supabase 프로젝트 화면에서 `SQL Editor` 이동
2. `New query` 클릭
3. 이 저장소의 `supabase/schema.sql` 내용을 전체 복사해서 붙여넣기
4. `Run` 실행
5. `Table Editor`에서 `food_items` 테이블 생성 확인

`schema.sql`에 포함된 내용 요약:

- `food_items` 테이블 생성
- `name` 길이 제한(1~40)
- `expires_on` 날짜 컬럼
- 소비기한 정렬 최적화를 위한 인덱스 생성

## 2-3. API 키/URL 확인

1. Supabase 프로젝트에서 `Settings` -> `API` 이동
2. 아래 2개 값을 복사
   - `Project URL` -> `SUPABASE_URL`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY`

중요:

- `service_role` 키는 관리자급 권한입니다.
- 절대 프론트엔드 코드에 노출하면 안 됩니다.
- 이 프로젝트는 서버 코드에서만 사용하도록 작성되어 있습니다.

---

## 3) 로컬 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래를 입력하세요.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASIC_AUTH_USER=
APP_BASIC_AUTH_PASSWORD=
```

값 넣는 방법:

- `SUPABASE_URL`: 방금 복사한 Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: 방금 복사한 service_role key
- `APP_BASIC_AUTH_USER`, `APP_BASIC_AUTH_PASSWORD`:
  - 사용하려면 둘 다 입력
  - 사용 안 하려면 둘 다 비워두기

주의:

- 둘 중 하나만 넣으면 앱이 계속 401(인증 실패) 응답을 줄 수 있습니다.
- 이 저장소의 `.gitignore`는 `.env*`를 무시하므로 비밀값이 실수로 커밋될 위험이 낮습니다.

---

## 4) 로컬 실행 및 기능 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 확인:

1. 식품 이름 + 날짜 입력 후 `등록하기`
2. 목록에 추가되는지 확인
3. 소비기한 임박 순서로 정렬되는지 확인
4. `삭제` 버튼이 동작하는지 확인

Basic Auth를 설정했다면:

- 접속 시 브라우저 로그인 팝업이 뜹니다.
- `APP_BASIC_AUTH_USER`/`APP_BASIC_AUTH_PASSWORD`로 로그인합니다.

---

## 5) GitHub에 코드 업로드

Vercel은 보통 GitHub 저장소를 연결해 배포합니다.

```bash
git add .
git commit -m "prepare deployment"
git push origin <YOUR_BRANCH>
```

메인 브랜치 배포를 원하면 PR 머지 후 `main`에 반영하세요.

---

## 6) Vercel 배포

## 6-1. 프로젝트 연결

1. https://vercel.com 로그인
2. `Add New...` -> `Project`
3. GitHub 저장소 Import
4. Framework Preset이 Next.js로 잡히는지 확인

## 6-2. 환경 변수 등록 (중요)

Deploy 전에 Vercel 프로젝트의 Environment Variables에 아래를 추가하세요.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASIC_AUTH_USER` (선택)
- `APP_BASIC_AUTH_PASSWORD` (선택)

권장:

- Preview/Production 모두 같은 방식으로 설정
- Basic Auth를 쓸 거면 user/password를 항상 쌍으로 입력

## 6-3. 배포 실행

1. `Deploy` 클릭
2. 빌드 완료 대기
3. 발급된 URL 접속

첫 배포 이후에는 Git push 때 자동 재배포됩니다.

---

## 7) 배포 후 점검 체크리스트

- 페이지가 열리는가?
- (Basic Auth 사용 시) 인증 팝업이 뜨고 통과되는가?
- 등록/조회/삭제가 모두 동작하는가?
- 날짜 상태 배지(오늘까지/남음/지남)가 정상인가?
- Vercel Function Logs에 에러가 없는가?

Vercel 로그 확인 위치:

- Project -> `Deployments` -> 배포 선택 -> `Functions` / `Runtime Logs`

---

## 8) 자주 발생하는 문제와 해결

## 문제 1) `SUPABASE_URL is not set` 또는 키 관련 에러

원인:

- `.env.local` 미설정
- Vercel 환경 변수 미등록

해결:

1. 변수 이름 오탈자 확인
2. 로컬에서는 `.env.local` 저장 후 dev 서버 재시작
3. Vercel에서는 변수 저장 후 `Redeploy`

## 문제 2) 배포 URL 접속 시 계속 401

원인:

- `APP_BASIC_AUTH_USER` 또는 `APP_BASIC_AUTH_PASSWORD` 하나만 설정됨

해결:

- 둘 다 넣거나, 둘 다 제거

## 문제 3) 테이블 없음 에러 (`food_items` 관련)

원인:

- `supabase/schema.sql` 미적용

해결:

- Supabase SQL Editor에서 스키마 다시 실행

## 문제 4) 등록은 되는데 목록이 이상하게 보임

확인 포인트:

- `expires_on`이 `YYYY-MM-DD` 형태인지
- 로컬/배포 모두 최신 코드인지

---

## 9) 운영 팁 (권장)

- 서비스 롤 키는 주기적으로 로테이션 고려
- 팀 운영 시 Vercel 환경 변수 접근 권한 최소화
- 변경 전후로 최소한 등록/삭제 스모크 테스트 수행
- 장애 대응을 위해 Supabase/Vercel 로그 확인 루틴 마련

---

## 10) 빠른 요약

진짜 핵심만 다시 정리하면:

1. Supabase 프로젝트 만들고 `supabase/schema.sql` 실행
2. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 확보
3. 로컬 `.env.local`에 값 넣고 `npm run dev`로 확인
4. GitHub push
5. Vercel Import + 동일 환경 변수 등록 + Deploy
6. 배포 URL에서 등록/삭제 동작 확인

이 순서대로 하면 무리 없이 배포까지 완료할 수 있습니다.
