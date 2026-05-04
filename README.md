# 티격태격 — 프론트엔드

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

Node.js 18 이상 권장.

---

## 기술 스택

| 분류 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite 6 |
| 라우팅 | React Router v7 |
| 스타일링 | Tailwind CSS v4 |
| 애니메이션 | Motion (Framer Motion) |
| UI 컴포넌트 | Radix UI, shadcn/ui 패턴 |
| 아이콘 | Lucide React |
| 차트 | Recharts |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── App.tsx                  # 루트 컴포넌트, Suspense 래퍼
│   ├── routes.tsx               # 전체 라우트 정의
│   ├── pages/                   # 페이지 컴포넌트
│   │   ├── Landing.tsx          # 랜딩 (/)
│   │   ├── Home.tsx             # 홈 — 모드 선택 (/home)
│   │   ├── TwoPersonInput.tsx   # 2인 모드 — 방 생성 + 작성 (/new)
│   │   ├── InviteJoin.tsx       # 초대 링크로 참여 (/invite/:roomId)
│   │   ├── WaitingRoom.tsx      # 2인 상대방 대기 화면 (/waiting/:roomId)
│   │   ├── Dashboard.tsx        # 2인 분석 결과 (/analysis)
│   │   ├── SoloInput.tsx        # 1인 모드 — 작성 (/solo)
│   │   ├── SoloLoading.tsx      # 1인 분석 중 로딩 (/solo-loading)
│   │   ├── SoloDashboard.tsx    # 1인 분석 결과 (/solo-analysis)
│   │   ├── History.tsx          # 지난 대화 기록 (/history)
│   │   ├── MyPage.tsx           # 마이페이지 (/mypage)
│   │   ├── SafetyAlert.tsx      # 위험 키워드 감지 시 표시 (/safety)
│   │   └── ...
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 기반 공통 컴포넌트
│   │   ├── ConflictVisualization.tsx
│   │   ├── DetailModal.tsx
│   │   ├── MobileLayout.tsx
│   │   └── TextView.tsx
│   └── utils/
│       ├── analysisEngine.ts    # AI 분석 로직 (현재 Mock)
│       └── authContext.tsx      # 인증 Context (현재 Mock)
├── styles/
│   ├── index.css                # 진입점 — 나머지 CSS import
│   ├── tailwind.css
│   ├── fonts.css
│   └── theme.css
└── main.tsx                     # ReactDOM.createRoot 진입점
```

---

## 페이지 흐름

### 2인 모드 (갈등 상대방과 함께)

```
/home
  └─▶ /new            방 생성 (닉네임 + 4자리 PIN 설정)
        └─▶ /new      내 이야기 작성 + 초대 링크 생성
              │
              ├─ 상대방이 /invite/:roomId 접속
              │     └─▶ 닉네임 입력 → PIN 입력 → 이야기 작성
              │
              └─▶ /waiting/:roomId   상대방 완료 대기
                    └─▶ /analysis    두 사람 분석 결과 대시보드
```

**2인 데이터 흐름:**
- 방 생성자(A)가 `localStorage`에 방 데이터 저장 (`room_{roomId}`)
- 상대방(B)이 같은 키에 자신의 입력 추가
- 두 사람 모두 완료되면 `sessionStorage("analysisData")`에 저장 후 `/analysis`로 이동
- WaitingRoom은 1.5초마다 `localStorage`를 폴링해서 상대방 완료 여부 확인

### 1인 모드 

```
/home
  └─▶ /solo           내 생각 자유롭게 작성
        └─▶ /solo-loading   분석 중 로딩
              └─▶ /solo-analysis   분석 결과 대시보드
```

**데이터 흐름:** `sessionStorage("soloData")` → 분석 → 결과 표시

---

## 핵심 기능 

### 위험 키워드 감지 -> 나중에 safety 쓸 때 형식에 맞게 수정

`TwoPersonInput`, `InviteJoin`, `SoloInput` 세 곳에서 공통으로 동작합니다.

```ts
const DANGER_KEYWORDS = ["자해", "자살", "죽고 싶", "폭행", "폭력", ...];

function hasDanger(text: string) {
  return DANGER_KEYWORDS.some((kw) => text.includes(kw));
}
// 감지 시 → navigate("/safety")
```

새 위험 키워드를 추가하려면 세 파일 모두 수정해야 함.

### 분석 엔진 (`analysisEngine.ts`)

현재는 **Mock 데이터**를 반환합니다. 실제 AI API 연동 시 이 파일의 함수들을 교체하면 됩니다.

```ts
// 두 사람 모드 분석
analyzeTwoPersonConflict(personA, personB): ConflictAnalysis

// 생각 정리 모드 분석
analyzeSoloThoughts(data): ConflictAnalysis
```

분석 결과의 카테고리는 4가지입니다:

| 카테고리 | 설명 | 색상 |
|---------|------|------|
| `fact` | 사실 — 객관적으로 있었던 일 | 남색 `#6366F1` |
| `interpretation` | 해석 — 그 상황을 어떻게 받아들였는지 | 노란색 `#F59E0B` |
| `emotion` | 감정 — 그때 느낀 감정 | 분홍색 `#FF6B8A` |
| `need` | 요구 — 원하는 것, 바라는 것 | 초록색 `#10B981` |

### 인증 (`authContext.tsx`)

현재는 **Mock 로그인**입니다. Google 로그인 버튼을 누르면 랜덤 사용자 정보가 `localStorage("cm_user")`에 저장됩니다.

```ts
const { user, login, logout } = useAuth();
```

실제 Google OAuth 연동 시 `AuthProvider` 내부의 `login()` 함수를 교체하면 됩니다.

### 데모 모드 (WaitingRoom)

대기 화면 하단의 "데모용: 예시 데이터로 바로 분석 →" 버튼을 누르면 상대방 데이터를 자동으로 채워서 즉시 분석으로 넘어갑니다.

---

## 경로 별칭

`@`는 `src/` 디렉토리를 가리킵니다.

```ts
import { Button } from '@/app/components/ui/button';
```

---

## 주요 설계 결정

- **SPA 라우팅**: `createBrowserRouter` 사용. 새로고침 시 404가 발생하지 않도록 Vite 개발 서버에 fallback 설정 포함.
- **상태 저장소**: 백엔드 없이 `localStorage` / `sessionStorage`로 방 데이터와 분석 데이터를 주고받음. 추후 API 연동 시 교체 대상.
- **모바일 우선**: 최대 너비를 `max-w-[480px]` ~ `max-w-[560px]`로 제한해 모바일 앱처럼 보이도록 설계. -> 이거 반응형으로 바꿔야 함
- **shadcn/ui 패턴**: `src/app/components/ui/` 안의 컴포넌트들은 Radix UI 기반의 headless 컴포넌트입니다. 직접 수정하기보다 래핑해서 사용하세요.

---
