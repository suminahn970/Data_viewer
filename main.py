# main.py (수정된 데이터 제한 로직 포함)
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... [COLUMN_TRANSLATIONS 및 translate_column_name 함수는 기존과 동일] ...

@app.post("/analyze")
async def analyze_data(
    file: UploadFile = File(...), 
    target_column: str = Form(None), 
    row_limit: str = Form("10")
):
    # 1. 파일 읽기
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        return {"error": f"CSV 파일을 읽을 수 없습니다: {str(e)}"}
    
    # 2. 컬럼명 공백 제거
    df.columns = df.columns.str.strip()
    total_rows = len(df)
    
    # ⭐️ [핵심 수정] 2-1. row_limit 처리 로직 강화
    # row_limit이 'all'이 아니고 값이 존재할 때만 자르기 시도
    if row_limit and str(row_limit).lower() != "all":
        try:
            limit_val = int(row_limit)
            # 데이터 개수보다 큰 값이 들어오면 전체 데이터 유지, 아니면 자르기
            if limit_val > 0:
                df = df.head(limit_val)
        except (ValueError, TypeError):
            # 숫자로 변환 불가능한 값이 오면 기본적으로 앞의 10개만 사용 (안전 장치)
            df = df.head(10)
    
    # 데이터가 비어있는 경우 방어
    if df.empty:
        return {
            "display_metrics": [{"label": "데이터 없음", "value": 0, "unit": "건", "feature": None}],
            "result": {"headers": df.columns.tolist(), "preview_rows": [], "total_rows": total_rows},
            "analyzed_rows": 0
        }

    # 3. 수치형 컬럼 자동 탐지
    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    
    # 4. 컬럼별 맞춤 지표 계산 (기존 로직 유지하되 안전하게 실행)
    display_metrics = []
    mean_keywords = ['나이', 'age', '점수', '평점', '혼잡도']
    sum_keywords = ['료', '금액', '매출', '프리미엄', '가격', '수량']
    count_keywords = ['ID', '번호', '코드']
    
    main_feature = target_column if target_column and target_column in df.columns else None
    
    for col in numeric_columns:
        col_lower = col.lower()
        # 평균 중심
        if any(keyword in col for keyword in mean_keywords):
            avg_value = float(df[col].mean())
            col_translated = translate_column_name(col)
            unit = "세" if '나이' in col or 'age' in col_lower else ""
            display_metrics.append({
                "label": f"{col_translated} (평균)",
                "value": int(avg_value) if avg_value.is_integer() else round(avg_value, 2),
                "unit": unit,
                "feature": col
            })
        # 합계 중심
        elif any(keyword in col for keyword in sum_keywords):
            sum_value = float(df[col].sum())
            if main_feature is None: main_feature = col
            col_translated = translate_column_name(col)
            unit = "₩" if any(kw in col for kw in ['료', '금액', '매출', '프리미엄', '가격']) else ""
            display_metrics.append({
                "label": f"{col_translated} (합계)",
                "value": int(sum_value) if sum_value.is_integer() else round(sum_value, 2),
                "unit": unit,
                "feature": col
            })

    # 총 분석된 데이터 수 지표 추가
    analyzed_rows = len(df)
    display_metrics.append({
        "label": "분석된 데이터 수",
        "value": analyzed_rows,
        "unit": "건",
        "feature": None
    })

    # ... [5~8단계: 미리보기 데이터 및 프리셋 생성 로직은 기존과 동일하게 유지] ...
    
    # JSON 직렬화가 가능하도록 preview_rows 생성 (기존 로직 동일)
    max_preview_rows = min(len(df), 1000)
    preview_df = df.head(max_preview_rows)
    preview_rows = []
    for _, row in preview_df.iterrows():
        row_data = []
        for val in row:
            if pd.isna(val): row_data.append(None)
            elif isinstance(val, (int, float)):
                row_data.append(int(val) if float(val).is_integer() else float(val))
            else: row_data.append(str(val))
        preview_rows.append(row_data)

    return {
        "display_metrics": display_metrics,
        "main_feature": translate_column_name(main_feature) if main_feature else None,
        "analysis_presets": analysis_presets if 'analysis_presets' in locals() else [],
        "analyzed_rows": analyzed_rows,
        "result": {
            "headers": df.columns.tolist(),
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }