# main.py (FastAPI 백엔드 엔진)
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

# 프론트엔드(React)와의 통신 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 컬럼명 한글 매핑 딕셔너리
COLUMN_TRANSLATIONS = {
    'age': '나이',
    'premium': '보험료',
    'income': '소득',
    'gender': '성별',
    'user_id': '사용자 수',
    'price': '가격',
    'amount': '금액',
    'revenue': '매출',
    'quantity': '수량',
    'score': '점수',
    'rating': '평점',
    'total': '합계',
    'count': '개수',
    'id': 'ID',
    'code': '코드',
    'number': '번호',
}

def translate_column_name(col_name: str) -> str:
    """컬럼명을 한글로 번역. 매핑되지 않은 경우 첫 글자를 대문자로 표시"""
    col_lower = col_name.lower().strip()
    
    # 정확한 매칭 시도
    if col_lower in COLUMN_TRANSLATIONS:
        return COLUMN_TRANSLATIONS[col_lower]
    
    # 부분 매칭 시도 (컬럼명에 키워드 포함)
    for key, value in COLUMN_TRANSLATIONS.items():
        if key in col_lower:
            return value
    
    # 매핑되지 않은 경우 첫 글자를 대문자로
    if col_name:
        return col_name[0].upper() + col_name[1:] if len(col_name) > 1 else col_name.upper()
    return col_name

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), target_column: str = Form(None), row_limit: str = Form("10")):
    # 1. 파일 읽기
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # 2. 컬럼명 공백 제거
    df.columns = df.columns.str.strip()
    
    # 2-1. row_limit에 따라 데이터 제한
    total_rows = len(df)
    if row_limit and row_limit.lower() != "all":
        try:
            limit = int(row_limit)
            df = df.head(limit)  # 앞에서 limit 개수만큼만 사용
        except (ValueError, TypeError):
            pass  # 잘못된 값이면 기본값(10) 사용하거나 전체 사용
    # 'all'이면 전체 데이터 사용
    
    # 3. 수치형 컬럼 자동 탐지
    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    
    # 4. 컬럼별 맞춤 지표 계산
    display_metrics = []
    
    # 키워드 정의
    mean_keywords = ['나이', 'age', '점수', '평점', '혼잡도']
    sum_keywords = ['료', '금액', '매출', '프리미엄', '가격', '수량']
    count_keywords = ['ID', '번호', '코드']
    
    # main_feature는 target_column이 지정되면 그것을 사용, 아니면 첫 번째 합계 중심 컬럼 또는 첫 번째 숫자 컬럼
    main_feature = target_column if target_column and target_column in df.columns else None
    
    # 숫자 컬럼들을 순회하며 지표 계산
    for col in numeric_columns:
        col_lower = col.lower()
        
        # 평균 중심 (Mean)
        if any(keyword in col for keyword in mean_keywords):
            try:
                avg_value = float(df[col].mean()) if len(df) > 0 else 0
                col_translated = translate_column_name(col)
                
                # 나이(age) 관련 지표는 반드시 단위 '세'로 표시
                if '나이' in col or 'age' in col_lower:
                    unit = "세"
                else:
                    unit = ""  # 평균은 기본적으로 단위 없이
                
                display_metrics.append({
                    "label": f"{col_translated} (평균)",
                    "value": int(avg_value) if avg_value.is_integer() else round(avg_value, 2),
                    "unit": unit,
                    "feature": col
                })
            except (ValueError, TypeError):
                pass
        
        # 합계 중심 (Sum)
        elif any(keyword in col for keyword in sum_keywords):
            try:
                sum_value = float(df[col].sum()) if len(df) > 0 else 0
                if main_feature is None:
                    main_feature = col
                col_translated = translate_column_name(col)
                
                # 단위 결정 (화폐 단위가 필요한 지표 구분)
                if any(kw in col for kw in ['료', '금액', '매출', '프리미엄', '가격']) or any(kw in col_lower for kw in ['premium', 'price', 'revenue', 'amount']):
                    unit = "₩"
                elif "수량" in col or "quantity" in col_lower:
                    unit = "개"
                else:
                    unit = ""
                
                display_metrics.append({
                    "label": f"{col_translated} (합계)",
                    "value": int(sum_value) if sum_value.is_integer() else round(sum_value, 2),
                    "unit": unit,
                    "feature": col
                })
            except (ValueError, TypeError):
                pass
        
        # 카운트는 건너뜀 (ID, 번호, 코드는 합산하지 않음)
        elif any(keyword in col for keyword in count_keywords):
            continue
    
    # 총 데이터 수 추가 (원본 전체 행 수와 현재 분석 중인 행 수 구분)
    analyzed_rows = int(len(df)) if len(df) > 0 else 0
    display_metrics.append({
        "label": "총 데이터 수",
        "value": analyzed_rows,
        "unit": "건",
        "feature": None
    })
    
    # main_feature가 없으면 첫 번째 숫자 컬럼 사용
    # target_column이 지정되었고 숫자 컬럼이면 해당 컬럼에 대한 지표 추가
    if main_feature is None and len(numeric_columns) > 0:
        # 이미 처리된 컬럼 목록
        processed_features = [m["feature"] for m in display_metrics if m["feature"]]
        
        # target_column이 지정되고 숫자 컬럼이면 우선 사용
        if target_column and target_column in numeric_columns and target_column not in processed_features:
            main_feature = target_column
            try:
                # 해당 컬럼이 숫자형이면 합계와 평균 추가
                sum_value = float(df[main_feature].sum()) if len(df) > 0 else 0
                avg_value = float(df[main_feature].mean()) if len(df) > 0 else 0
                col_translated = translate_column_name(main_feature)
                
                # 단위 결정
                col_lower = main_feature.lower()
                unit = "₩" if any(kw in main_feature for kw in ['료', '금액', '매출', '프리미엄', '가격']) or any(kw in col_lower for kw in ['premium', 'price', 'revenue', 'amount']) else ""
                
                # 합계 추가
                display_metrics.insert(0, {
                    "label": f"{col_translated} (합계)",
                    "value": int(sum_value) if sum_value.is_integer() else round(sum_value, 2),
                    "unit": unit,
                    "feature": main_feature
                })
                
                # 평균 추가 (화폐 단위 제외)
                display_metrics.insert(1, {
                    "label": f"{col_translated} (평균)",
                    "value": int(avg_value) if avg_value.is_integer() else round(avg_value, 2),
                    "unit": "",
                    "feature": main_feature
                })
            except (ValueError, TypeError):
                pass
        else:
            # 아직 처리되지 않은 첫 번째 숫자 컬럼 찾기
            for col in numeric_columns:
                if col not in processed_features:
                    main_feature = col
                    # 기본 합계 추가
                    try:
                        sum_value = float(df[main_feature].sum()) if len(df) > 0 else 0
                        col_translated = translate_column_name(main_feature)
                        display_metrics.insert(0, {
                            "label": f"{col_translated} (합계)",
                            "value": int(sum_value) if sum_value.is_integer() else round(sum_value, 2),
                            "unit": "",
                            "feature": main_feature
                        })
                    except (ValueError, TypeError):
                        pass
                    break
    
    # 5. 미리보기 데이터 준비 (실제 분석된 데이터 전체, 성능 고려하여 최대 1000개로 제한)
    # numpy 타입을 Python 기본 타입으로 변환하여 JSON 직렬화 가능하게 함
    # 차트 분석을 위해 실제 분석된 데이터를 전송 (성능을 위해 최대 1000개 행으로 제한)
    max_preview_rows = min(len(df), 1000)
    preview_df = df.head(max_preview_rows)
    preview_rows = []
    for _, row in preview_df.iterrows():
        row_data = []
        for val in row:
            # numpy 타입을 Python 기본 타입으로 변환
            if pd.isna(val):
                row_data.append(None)
            elif isinstance(val, (int, float)):
                # 정수로 변환 가능하면 정수로, 아니면 실수로
                row_data.append(int(val) if float(val).is_integer() else float(val))
            else:
                row_data.append(str(val))
        preview_rows.append(row_data)
    headers = df.columns.tolist()
    
    # 6. 동적 분석 프리셋 생성
    analysis_presets = []
    processed_columns = set()  # 중복 제거를 위한 set
    
    # 범주형(Object) 컬럼 찾기
    object_columns = df.select_dtypes(include=['object', 'string']).columns.tolist()
    # ID, 코드, 번호 등은 제외
    categorical_columns = [
        col for col in object_columns 
        if not any(kw in col.lower() for kw in ['id', 'code', '번호', '코드'])
    ]
    
    # 상위 3~5개 범주형 컬럼 선택 (고유값 개수가 많은 순서)
    if len(categorical_columns) > 0:
        categorical_scores = []
        for col in categorical_columns:
            try:
                unique_count = df[col].nunique()
                total_count = len(df[col].dropna())
                # 고유값 비율이 적절한 컬럼 선호 (너무 많거나 적지 않은 것)
                if 2 <= unique_count <= total_count * 0.5:  # 2개 이상, 전체의 50% 이하
                    categorical_scores.append((col, unique_count))
            except:
                continue
        
        # 고유값 개수로 정렬하여 상위 3~5개 선택
        categorical_scores.sort(key=lambda x: x[1], reverse=True)
        top_categorical = [col for col, _ in categorical_scores[:5]]
        
        for col in top_categorical:
            if col not in processed_columns:
                col_translated = translate_column_name(col)
                analysis_presets.append({
                    "label": f"{col_translated} 분포 분석",
                    "column": col,
                    "type": "distribution"
                })
                processed_columns.add(col)
    
    # 수치형(Numeric) 컬럼: 주요 금액/수치 관련 컬럼
    numeric_keywords = ['료', '금액', '매출', '프리미엄', '가격', '수량', 'amount', 'price', 'revenue', 'premium', 'quantity']
    numeric_analysis_columns = [
        col for col in numeric_columns
        if any(kw in col.lower() for kw in numeric_keywords)
        and col not in count_keywords
    ]
    
    # 상위 3~5개 선택 (중복 제거)
    for col in numeric_analysis_columns[:5]:
        if col not in processed_columns:
            col_translated = translate_column_name(col)
            analysis_presets.append({
                "label": f"{col_translated} 통계 분석",
                "column": col,
                "type": "statistics"
            })
            processed_columns.add(col)
    
    # 불리언/상태형 컬럼 찾기
    boolean_keywords = ['여부', 'is_', 'status', '상태', 'flag', 'yn', 'y/n']
    boolean_columns = []
    
    # 범주형 컬럼 중 불리언 성격인 것 찾기 (고유값이 2개인 경우)
    for col in categorical_columns:
        try:
            unique_values = df[col].dropna().unique()
            if len(unique_values) <= 2:
                boolean_columns.append(col)
        except:
            continue
    
    # 키워드 기반 불리언 컬럼 찾기
    keyword_boolean = [
        col for col in df.columns
        if any(kw in col.lower() for kw in boolean_keywords)
    ]
    boolean_columns.extend(keyword_boolean)
    
    # 중복 제거 및 상위 3~5개 선택
    boolean_columns = list(dict.fromkeys(boolean_columns))[:5]
    
    for col in boolean_columns:
        if col not in processed_columns:
            col_translated = translate_column_name(col)
            analysis_presets.append({
                "label": f"{col_translated} 현황",
                "column": col,
                "type": "status"
            })
            processed_columns.add(col)
    
    # 7. main_feature 한글 번역
    main_feature_translated = translate_column_name(main_feature) if main_feature else None
    
    # 8. 프론트엔드(React)로 보낼 결과값 (JSON)
    return {
        "domain": "e-commerce",
        "display_metrics": display_metrics,
        "main_feature": main_feature_translated,
        "analysis_presets": analysis_presets,
        "analyzed_rows": analyzed_rows,
        "result": {
            "headers": headers,
            "preview_rows": preview_rows,
            "total_rows": total_rows
        }
    }