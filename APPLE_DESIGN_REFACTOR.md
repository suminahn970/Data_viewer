# Apple 디자인 리팩토링 완료

## ✅ 완료된 작업

### 1. Bento Grid 레이아웃 적용
- 12-column 그리드 시스템으로 재구성
- KPI Metrics: 전체 너비 (12 columns)
- Gemini AI Insight: 전체 너비 (12 columns) - 특별 스타일링
- Data Cleaning Section: 좌측 (6 columns)
- Smart Insights Panel: 우측 (6 columns)
- Visual Insight: 전체 너비 (12 columns)
- Data Table: 전체 너비 (12 columns)

### 2. Glassmorphism 스타일
- `glass-card` 유틸리티 클래스 추가
- `bg-white/70 backdrop-blur-md border border-gray-100` 적용
- 모든 카드에 유리 같은 반투명 효과 적용

### 3. 타이포그래피 개선
- 헤더: `text-4xl font-bold` (더 큰 폰트)
- 서브헤더: `text-base text-slate-500` (여유로운 간격)
- KPI 수치: `text-5xl font-extrabold` (더 큰 수치)
- 자간 조정: `tracking-tight`, `tracking-wide` 적용
- 색상: `text-slate-900` (주요 텍스트), `text-slate-500` (보조 텍스트)

### 4. Gemini 분석창 특별 스타일링
- `apple-gradient`: 옅은 그라데이션 배경
- `apple-glow`: 은은한 글로우 효과
- 더 큰 아이콘 (20x20) 및 강조된 디자인
- 애니메이션 펄스 효과

### 5. Framer Motion 애니메이션
- 모든 섹션에 부드러운 fade-in + slide-up 애니메이션
- Stagger 효과 (각 섹션마다 delay 적용)
- Easing: `[0.22, 1, 0.36, 1]` (Apple 스타일)

### 6. 보안 확인 ✅
- ✅ API 키는 서버 사이드에서만 사용 (`app/api/insight/route.ts`)
- ✅ 클라이언트에서는 `/api/insight` 엔드포인트만 호출
- ✅ `NEXT_PUBLIC_` 접두사 제거 완료
- ✅ 환경 변수는 `.env.local`에서 관리 (클라이언트 번들에 포함되지 않음)

## 📦 설치 필요

```bash
npm install framer-motion
```

## 🎨 주요 스타일 변경사항

### CSS 유틸리티 클래스 추가 (`globals.css`)
- `.glass-card`: Glassmorphism 기본 스타일
- `.glass-card-hover`: 호버 효과
- `.apple-glow`: 글로우 효과
- `.apple-gradient`: 그라데이션 배경

### 컴포넌트별 변경
- **KpiMetrics**: Glassmorphism + Motion 애니메이션
- **DataCleaningSection**: Glassmorphism 적용
- **SmartInsightsPanel**: Glassmorphism 적용
- **VisualInsight**: Glassmorphism 적용
- **DataTable**: Glassmorphism 적용
- **Gemini AI Insight**: 특별 스타일링 (그라데이션 + 글로우)

## 🔒 보안 상태

모든 API 키는 서버 사이드에서만 사용되며, 클라이언트 번들에 포함되지 않습니다.

- ✅ `OPENAI_API_KEY`: 서버 사이드 전용
- ✅ `GEMINI_API_KEY`: 서버 사이드 전용
- ✅ `NEXT_PUBLIC_API_URL`: 공개 URL (문제없음)

