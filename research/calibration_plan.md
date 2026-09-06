# English Map empirical calibration plan

## 원칙

초기 버전은 규칙 기반 adaptive diagnostic이다. 실제 응답 데이터가 쌓이기 전에는 문항 난이도, 변별도, CEFR 컷을 실측값처럼 표현하지 않는다.

## 수집할 핵심 신호

각 객관식/단답 문항마다 다음을 저장한다.

- correct
- responseTimeMs
- answerChanges
- replayCount (Listening)
- firstSeenAt
- section / skill / KR2022 / CEFR tag
- Foundation / Ceiling 진입 여부

Speaking/Writing은 0~3 analytic rubric 원점수를 차원별로 보존한다. 총점만 저장하지 않는다.

## 데이터 규모별 사용

### Pilot: 아주 적은 표본

- 개별 학생 오답 패턴 확인
- 지나치게 쉽거나 어려운 문항 탐색
- 지시문 오해, distractor 문제, 비정상적으로 긴 응답시간 확인
- 추천 규칙의 명백한 오작동 수정

이 단계에서는 IRT 파라미터를 추정하지 않는다.

### Early sample

응시자가 늘어나면 문항별로 다음을 계산한다.

- facility / p-value: 정답 비율
- median response time + IQR
- Listening replay 사용률
- answer-change rate
- 상·하위 수행집단 정답률 차이
- point-biserial discrimination (표본이 충분할 때)

표본 수가 작을 때의 수치는 provisional로 표시한다.

### Larger sample

표본이 충분히 확보되면 다음을 검토한다.

- Rasch 또는 2PL IRT
- item difficulty / discrimination
- test information by skill band
- routing threshold 재설정
- 중복 문항 및 저변별 문항 제거
- CEFR evidence threshold에 대한 경험적 검토

특정 표본 수 하나를 '공인 기준'처럼 취급하지 않는다. 모델 안정성, 문항 수, 응시자 능력 분포를 함께 본다.

## 문항 검토 플래그

다음 중 하나가 반복되면 REVIEW 후보로 올린다.

1. 예상 band보다 지나치게 높은/낮은 정답률
2. 정답자와 오답자의 응답시간 분포가 이상함
3. 특정 오답 distractor에 과도하게 몰림
4. answerChanges가 비정상적으로 높음
5. Listening에서 재청취 여부에 따라 정답률이 크게 달라짐
6. 같은 skill의 다른 문항과 결과가 지속적으로 충돌
7. KR2022/CEFR mapping과 실제 수행 패턴이 맞지 않음

## 추천엔진 calibration

교재 추천은 처음부터 학습성과 인과관계를 주장하지 않는다.

초기에는 진단 profile → 교재 feature match 규칙을 사용한다. 이후 다음을 기록할 수 있을 때 weight를 조정한다.

- 추천 당시 profile
- 실제 선택한 교재
- 수업 기간
- mini-test 변화량
- 재진단 변화량
- tutor judgement

예: `grammar knowledge high + productive control low` 학생에게 기초구문/영작 중심 처방 후 productive control이 반복적으로 개선되는지 관찰한다.

## 수행평가 주의

Speaking/Writing rubric은 한 명의 교사가 채점하는 초기 단계에서는 점수를 절대척도처럼 취급하지 않는다. 여러 채점자가 생기면 차원별 채점 일치도와 rater effect를 별도로 검토한다.

## 개인정보 최소화

- 원음/마이크 녹음은 현재 저장하지 않는다.
- 서버 저장 단계에서는 학생 실명 대신 learner ID 또는 별명 사용을 우선한다.
- 분석에 필요하지 않은 개인정보는 수집하지 않는다.
