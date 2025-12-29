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

COLUMN_TRANSLATIONS = {
    'age': '나이', 'premium': '보험료', 'income': '소득', 'gender': '성별',
    'user_id': '사용자 수', 'price': '가격', 'amount': '금액', 'revenue': '매출',
    'quantity': '수량', 'score': '점수', 'rating': '평점', 'total': '합계',
    'count': '개수', 'id': 'ID', 'code': '코드', 'number': '번호',
}

def translate_column_name(col_name: str) -> str:
    if not col_name: return col_name
    col_lower = col_name.lower().strip()
    if col_lower in COLUMN_TRANSLATIONS:
        return COLUMN_TRANSLATIONS[col_lower]
    for key, value in COLUMN_TRANSLATIONS.items():
        if key in col_lower: return value
    return col_name

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), target_column: str = Form(None), row_limit: str = Form("10")):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    df.columns = df.columns.str.strip()
    total_rows = len(df)
    
    # 데이터 제한 처리
    if row_limit and str(row_limit).lower() != "all":
        try:
            limit_val = int(row_limit)
            df = df.head(limit_val)
        except:
            df = df.head(10)

    # 1. 지표(KPI) 계산
    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    display_metrics = []
    for col in numeric_columns[:4]: # 상위 4개 지표 추출
        col_translated = translate_column_name(col)
        sum_val = float(df[col].sum())
        display_metrics.append({
            "label": f"{col_translated} (합계)",
            "value": int(sum_val) if sum_val.is_integer() else round(sum_val, 2),
            "unit": "",
            "feature": col
        })
    display_metrics.append({"label": "분석 데이터", "value": len(df), "unit": "건", "feature": None})

    # 2. ⭐️ 버튼(프리셋) 생성 로직 (이 부분이 있어야 버튼이 생깁니다)
    analysis_presets = []
    # 범주형(문자열) 컬럼 -> 분포 분석 버튼
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    for col in cat_cols[:3]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 분포 분석",
            "column": col,
            "type": "distribution"
        })
    # 수치형 컬럼 -> 통계 분석 버튼
    for col in numeric_columns[:2]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 통계 분석",
            "column": col,
            "type": "statistics"
        })

    # 3. 데이터 미리보기 (그래프를 그리기 위해 필수)
    preview_rows = []
    # JSON 전송을 위해 데이터를 안전하게 변환
    sample_df = df.head(1000) # 그래프용 데이터 넉넉히 전달
    for _, row in sample_df.iterrows():
        preview_rows.append([None if pd.isna(v) else (int(v) if isinstance(v, (int, float)) and float(v).is_integer() else v) for v in row])

    return {
        "display_metrics": display_metrics,
        "main_feature": translate_column_name(target_column) if target_column else None,
        "analysis_presets": analysis_presets, # ⭐️ 버튼 정보 전달
        "analyzed_rows": len(df),
        "result": {
            "headers": df.columns.tolist(),
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }