from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import numpy as np

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

def generate_insight(analysis_type: str, col: str, df: pd.DataFrame) -> str:
    try:
        if analysis_type == "distribution":
            top_val = df[col].value_counts().idxmax()
            top_pct = (df[col].value_counts().max() / len(df)) * 100
            return f"가장 비중이 높은 항목은 '{top_val}'이며, 전체의 {top_pct:.1f}%를 차지합니다."
        elif analysis_type == "statistics":
            mean_val = df[col].mean()
            max_val = df[col].max()
            return f"해당 데이터의 평균값은 {mean_val:,.1f}이며, 최대 수치는 {max_val:,.1f}로 분석되었습니다."
        elif analysis_type == "correlation":
            cols = col.split("__vs__")
            corr = df[cols[0]].corr(df[cols[1]])
            strength = "높은" if abs(corr) > 0.6 else "어느 정도의" if abs(corr) > 0.3 else "낮은"
            direction = "양(+)" if corr > 0 else "음(-)"
            return f"두 지표 사이에는 {strength} {direction}의 상관관계(r={corr:.2f})가 관찰됩니다."
        elif analysis_type == "outlier":
            mean, std = df[col].mean(), df[col].std()
            outlier_count = len(df[np.abs(df[col] - mean) > (2 * std)])
            return f"평균에서 크게 벗어난 이상 데이터가 {outlier_count}건 발견되었습니다. 상세 확인이 필요합니다."
    except:
        return "데이터를 분석하는 중입니다."
    return ""

# ⭐️ [신규 추가] 스마트 데이터 정제 엔드포인트
@app.post("/clean")
async def clean_data(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # 1. 중복 제거
    original_len = len(df)
    df = df.drop_duplicates()
    removed_duplicates = original_len - len(df)
    
    # 2. 결측치 처리 (숫자는 평균, 문자는 'Unknown')
    fixed_missing = 0
    for col in df.columns:
        null_count = df[col].isnull().sum()
        if null_count > 0:
            fixed_missing += null_count
            if df[col].dtype in ['int64', 'float64']:
                df[col] = df[col].fillna(df[col].mean())
            else:
                df[col] = df[col].fillna("Unknown")
            
    # 정제된 데이터를 다시 CSV 파일 형태로 전송하기 위해 변환
    output = io.StringIO()
    df.to_csv(output, index=False)
    
    return {
        "message": "데이터 정제가 완료되었습니다.",
        "removed_duplicates": int(removed_duplicates),
        "fixed_missing": int(fixed_missing),
        "cleaned_data": output.getvalue() # 정제된 CSV 데이터 자체를 리턴
    }

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), target_column: str = Form(None), row_limit: str = Form("10")):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    df.columns = df.columns.str.strip()
    total_rows = len(df)
    
    if row_limit and str(row_limit).lower() != "all":
        try:
            limit_val = int(row_limit)
            df = df.head(limit_val)
        except:
            df = df.head(10)

    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    display_metrics = []
    for col in numeric_columns[:4]:
        col_translated = translate_column_name(col)
        sum_val = float(df[col].sum())
        display_metrics.append({
            "label": f"{col_translated} (합계)",
            "value": int(sum_val) if sum_val.is_integer() else round(sum_val, 2),
            "unit": "",
            "feature": col
        })
    display_metrics.append({"label": "분석 데이터", "value": len(df), "unit": "건", "feature": None})

    analysis_presets = []
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    for col in cat_cols[:3]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 분포 분석",
            "column": col, "type": "distribution", "insight": generate_insight("distribution", col, df)
        })

    for col in numeric_columns[:2]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 통계 분석",
            "column": col, "type": "statistics", "insight": generate_insight("statistics", col, df)
        })

    if len(numeric_columns) >= 2:
        col1, col2 = numeric_columns[0], numeric_columns[1]
        combo_col = f"{col1}__vs__{col2}"
        analysis_presets.append({
            "label": f"{translate_column_name(col1)} vs {translate_column_name(col2)} 관계",
            "column": combo_col, "type": "correlation", "insight": generate_insight("correlation", combo_col, df)
        })

    for col in numeric_columns[:1]:
        analysis_presets.append({
            "label": f"{translate_column_name(col)} 이상치 탐지",
            "column": col, "type": "outlier", "insight": generate_insight("outlier", col, df)
        })

    preview_rows = []
    sample_df = df.head(1000)
    for _, row in sample_df.iterrows():
        preview_rows.append([None if pd.isna(v) else (int(v) if isinstance(v, (int, float)) and float(v).is_integer() else v) for v in row])

    return {
        "display_metrics": display_metrics,
        "main_feature": translate_column_name(target_column) if target_column else None,
        "analysis_presets": analysis_presets,
        "analyzed_rows": len(df),
        "result": {
            "headers": df.columns.tolist(),
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }