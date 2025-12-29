from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

# 1. CORS 설정 (반드시 최상단)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 번역 딕셔너리
COLUMN_TRANSLATIONS = {
    'age': '나이', 'premium': '보험료', 'income': '소득', 'gender': '성별',
    'user_id': '사용자 수', 'price': '가격', 'amount': '금액', 'revenue': '매출',
    'quantity': '수량', 'score': '점수', 'rating': '평점', 'total': '합계',
    'count': '개수', 'id': 'ID', 'code': '코드', 'number': '번호',
}

# 3. 번역 함수 (반드시 analyze_data 함수보다 위에 있어야 합니다!)
def translate_column_name(col_name: str) -> str:
    if not col_name: return col_name
    col_lower = col_name.lower().strip()
    if col_lower in COLUMN_TRANSLATIONS:
        return COLUMN_TRANSLATIONS[col_lower]
    for key, value in COLUMN_TRANSLATIONS.items():
        if key in col_lower: return value
    return col_name[0].upper() + col_name[1:] if len(col_name) > 1 else col_name.upper()

# 4. 분석 API
@app.post("/analyze")
async def analyze_data(
    file: UploadFile = File(...), 
    target_column: str = Form(None), 
    row_limit: str = Form("10")
):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    df.columns = df.columns.str.strip()
    total_rows = len(df)
    
    # 데이터 제한 로직
    if row_limit and str(row_limit).lower() != "all":
        try:
            limit_val = int(row_limit)
            if limit_val > 0: df = df.head(limit_val)
        except:
            df = df.head(10)

    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    display_metrics = []
    
    # 지표 계산 및 번역 함수 호출
    for col in numeric_columns:
        col_translated = translate_column_name(col) # ⭐️ 여기서 에러가 났던 것!
        val = float(df[col].sum())
        display_metrics.append({
            "label": f"{col_translated} (합계)",
            "value": int(val) if val.is_integer() else round(val, 2),
            "unit": "",
            "feature": col
        })

    # 총 데이터 수 추가
    display_metrics.append({
        "label": "분석된 데이터 수",
        "value": len(df),
        "unit": "건",
        "feature": None
    })

    # 미리보기 데이터 준비
    preview_rows = []
    for _, row in df.head(100).iterrows():
        preview_rows.append([None if pd.isna(v) else v for v in row])

    return {
        "display_metrics": display_metrics,
        "main_feature": translate_column_name(target_column) if target_column else None,
        "analysis_presets": [], # 간단한 버전으로 유지
        "analyzed_rows": len(df),
        "result": {
            "headers": df.columns.tolist(),
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }