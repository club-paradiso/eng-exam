# English Map MVP

초등학교 5학년 영어 진단용 파일럿 웹앱입니다.

## 실행

- 가장 간단히 `index.html`을 브라우저에서 엽니다.
- 브라우저 보안 정책 때문에 음성(TTS)이 막히면 이 폴더에서 `python -m http.server 8080` 후 `http://localhost:8080`으로 접속합니다.

## 포함 기능

- KR2022 + CEFR evidence tagging
- Vocabulary / Listening / Reading / Grammar 객관식·단답 자동채점
- Listening browser TTS + replay logging
- 혼공 8품사 Part 1~7 coverage extension
- Speaking / Writing 0~3 교사용 analytic rubric
- Foundation / Ceiling 조건부 분기
- 영역별 결과와 교재 추천
- localStorage 자동 저장 / 이어하기
- 결과 JSON export / 인쇄

## 주의

CEFR 결과는 파일럿 수행 증거이며 공인 등급 판정이 아닙니다. 실제 학생 응답이 쌓인 뒤 문항 난이도와 컷을 보정해야 합니다.
