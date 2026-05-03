# 명언 생성기

한국어 명언을 무작위로 보여 주는 간단한 정적 웹 페이지입니다. HTML, CSS, 바닐라 JavaScript만 사용합니다.

## 기능

- **다음 명언**: 내장된 명언 목록에서 무작위로 한 줄을 표시합니다. 숨겨진 키워드 입력(`#keywordInput`)에 값이 있으면 키워드 기반 문장을 생성합니다.
- **저장**: 현재 명언을 브라우저 `localStorage`에 넣고, 카드 하단 **저장된 명언 목록**에 표시합니다. 새로고침 후에도 유지되며, 항목마다 **삭제**할 수 있습니다.
- **공유**: Web Share API가 가능하면 시스템 공유를 시도하고, 아니면 이메일·SNS(X)·URL(또는 텍스트) 복사 옵션을 표시합니다.
- **저자 사진**: 명언이 바뀔 때마다 [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/page/summary/{title})로 영문 저자명(`authorEn`) 페이지 요약을 불러와, 썸네일이 있으면 카드 상단에 원형 이미지로 보여 줍니다. 없거나 오류면 영역을 숨깁니다.
- **푸터**: 페이지 하단에 `2026 오늘의 명언 Made with JJorifong` 크레딧을 표시합니다.

## 로컬에서 실행

정적 파일만 제공하면 됩니다. Python 예시:

```powershell
Set-Location "프로젝트_폴더_경로"
python -m http.server 8765
```

브라우저에서 `http://127.0.0.1:8765` 로 엽니다. Wikipedia API 호출은 네트워크가 필요합니다.

## 파일 구조

| 경로 | 설명 |
|------|------|
| `index.html` | 마크업 |
| `styles/main.css` | 스타일 |
| `scripts/app.js` | 명언 데이터, UI, 저장소, Wikipedia 요청 |

## 데이터 형식

`scripts/app.js`의 `quoteData` 항목은 `text`, `author`, `authorEn`(Wikipedia 제목용 영문명) 필드를 가집니다.

## 라이선스

저장소 정책에 따릅니다.
