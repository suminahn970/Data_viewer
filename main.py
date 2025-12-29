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

# ⭐️ 이 함수가 반드시 analyze_data 위에 있어야 합니다!
def translate_column_name(col_name: str) -> str:
    if not col_name: return col_name
    col_lower = col_name.lower().strip()
    if col_lower in COLUMN_TRANSLATIONS:
        return COLUMN_TRANSLATIONS[col_lower]
    for key, value in COLUMN_TRANSLATIONS.items():
        if key in col_lower: return value
    return col_name[0].upper() + col_name[1:] if len(col_name) > 1 else col_name.upper()

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), target_column: str = Form(None), row_limit: str = Form("10")):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    df.columns = df.columns.str.strip()
    total_rows = len(df)
    
    if row_limit and str(row_limit).lower() != "all":
        try:
            limit_val = int(row_limit)
            if limit_val > 0: df = df.head(limit_val)
        except:
            df = df.head(10)

    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    display_metrics = []
    
    # 지표 계산
    for col in numeric_columns:
        col_translated = translate_column_name(col)
        val = float(df[col].sum())
        display_metrics.append({
            "label": f"{col_translated} (합계)",
            "value": int(val) if val.is_integer() else round(val, 2),
            "unit": "",
            "feature": col
        })

    display_metrics.append({"label": "분석 데이터", "value": len(df), "unit": "건", "feature": None})

    # ⭐️ 사라졌던 프리셋 기능 복구
    analysis_presets = []
    # 범주형 컬럼 분석 (그래프용)
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    for col in cat_cols[:3]: # 상위 3개만
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 분포",
            "column": col,
            "type": "distribution"
        })
    # 수치형 컬럼 분석 (그래프용)
    for col in numeric_columns[:2]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 통계",
            "column": col,
            "type": "statistics"
        })

    preview_rows = []
    for _, row in df.head(100).iterrows():
        preview_rows.append([None if pd.isna(v) else v for v in row])

    return {
        "display_metrics": display_metrics,
        "main_feature": translate_column_name(target_column) if target_column else None,
        "analysis_presets": analysis_presets, # ⭐️ 이제 프리셋을 보냅니다!
        "analyzed_rows": len(df),
        "result": {
            "headers": df.columns.tolist(),
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }