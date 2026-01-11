# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Chrome Agent는 자연어 명령을 통해 웹 브라우저를 원격 제어하고 웹페이지 데이터를 추출하는 AI 기반 브라우저 자동화 시스템입니다. 세 가지 주요 컴포넌트로 구성됩니다:

1. **Chrome Extension** - 브라우저에서 명령을 실행하고 DOM/쿠키/폼 데이터 추출
2. **Java Netty Server** - WebSocket 허브, 세션 관리, AI Tool Calling 연동
3. **Agent UI** - 사용자가 자연어로 명령을 입력하는 웹 기반 챗봇 인터페이스

## 아키텍처

```
명령 에이전트 (agent-ui) <--WebSocket--> Netty Server <--WebSocket--> 크롬 확장 (extension)
                                            |
                                      Claude API (Tool Calling)
```

**통신 흐름:**
1. 사용자가 Agent UI에서 자연어 명령 입력 (예: "로그인 폼 정보 추출해줘")
2. 서버가 Claude API로 Tool Calling 요청 → 구조화된 명령 생성
3. 서버가 크롬 확장으로 COMMAND 메시지 전송
4. 확장이 브라우저에서 명령 실행 후 RESPONSE 반환
5. 서버가 Agent로 결과 전달 (RequestTracker로 요청-응답 상관관계 추적)

## 빌드 및 실행

### Server (Java 17+, Gradle)
```bash
cd server

# 빌드
./gradlew clean build

# 설정 파일 생성 (.env.local)
cp .env.local.example .env.local
# .env.local 파일을 열어 CLAUDE_API_KEY 등 필요한 값 설정

# 실행
java -jar build/libs/chrome-agent-server-1.0.0.jar
```
서버는 `ws://localhost:8080/ws`에서 WebSocket 연결 대기

### 설정 (.env.local)
`.env.local` 파일 또는 환경변수로 설정 가능 (우선순위: `.env.local` > 환경변수)

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `CLAUDE_API_KEY` | Yes | - | Claude API 키 |
| `CHROME_AGENT_PORT` | No | 8080 | 서버 포트 |
| `CLAUDE_MODEL` | No | claude-sonnet-4-20250514 | Claude 모델 |
| `HEARTBEAT_INTERVAL_SECONDS` | No | 10 | Heartbeat 간격 |
| `SESSION_RETENTION_SECONDS` | No | 30 | 세션 유지 시간 |
| `COMMAND_TIMEOUT_SECONDS` | No | 30 | 명령 타임아웃 |
| `RECONNECT_MAX_RETRIES` | No | 3 | 재연결 최대 시도 횟수 |
| `RECONNECT_INTERVAL_SECONDS` | No | 5 | 재연결 간격 |

### Chrome Extension
1. Chrome에서 `chrome://extensions` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램 로드" → `extension/` 폴더 선택

### Agent UI
`agent-ui/index.html`을 브라우저에서 직접 열거나 로컬 서버로 제공

## 프로젝트 구조

```
chrome-agent/
├── extension/                 # 크롬 확장 프로그램 (Manifest V3)
│   ├── background/service-worker.js  # WebSocket, 쿠키 추출
│   ├── content/content-script.js     # DOM/Form 추출
│   ├── popup/                        # 확장 팝업 UI
│   └── manifest.json
├── server/                    # Java Netty WebSocket 서버 (Gradle)
│   ├── build.gradle
│   └── src/main/java/com/chromeagent/
│       ├── ChromeAgentServer.java     # 진입점
│       ├── config/                    # 환경변수 기반 설정
│       ├── server/                    # Netty 서버 부트스트랩
│       ├── handler/                   # WebSocket 핸들러
│       ├── session/                   # 세션 관리 및 1:1 페어링
│       ├── router/                    # 메시지 라우팅 + RequestTracker
│       ├── ai/                        # Claude API 연동
│       ├── message/                   # 메시지 타입/직렬화
│       └── error/                     # 에러 코드/핸들러
├── agent-ui/                  # 명령 에이전트 웹 UI
└── docs/prompts/              # PRD 및 UI/UX 설계 문서
```

## 메시지 프로토콜

모든 WebSocket 메시지는 JSON 형식:

| 타입 | 방향 | 설명 |
|------|------|------|
| `CONNECT` | Client → Server | 연결 요청 (source: agent/extension) |
| `CONNECT_ACK` | Server → Client | 연결 승인 + sessionId 발급 |
| `CHAT` | Agent → Server | 자연어 명령 (AI 처리 대상) |
| `COMMAND` | Server → Extension | 구조화된 명령 (requestId로 상관관계 추적) |
| `RESPONSE` | Extension → Server → Agent | 실행 결과 |
| `STATUS` | Server → Client | 상태 변경 알림 (paired, peer_disconnected 등) |
| `HEARTBEAT` | Both | 연결 유지 (10초 간격) |
| `ERROR` | Server → Client | 에러 알림 |

**명령어 타입:**
- `EXTRACT_COOKIES` - 쿠키 추출
- `EXTRACT_DOM` - DOM 요소 추출
- `EXTRACT_FORM` - 폼 정보 추출
- `GET_PAGE_INFO` - 페이지 기본 정보

## 주요 기술 스택

- **Extension**: JavaScript, Chrome APIs (cookies, scripting, storage), Manifest V3
- **Server**: Java 17, Gradle, Netty 4.1, Jackson, OkHttp (AI API 호출)
- **Agent UI**: Vanilla JavaScript, WebSocket API

## 핵심 구현 사항

- **세션 페어링**: Agent와 Extension이 1:1로 페어링됨 (SessionManager)
- **요청-응답 추적**: RequestTracker가 messageId로 요청과 응답을 상관관계 추적
- **30초 세션 유지**: 연결 끊김 후 30초간 세션 유지하여 재연결 지원
- **Heartbeat**: 10초 간격 (IdleStateHandler + HeartbeatHandler)
- **Graceful Shutdown**: 서버 종료 시 클라이언트 알림 및 세션 정리

## 개발 참고사항

- 서버 설정은 `.env.local` 파일 또는 환경변수로 관리
- API 키는 절대 소스코드에 포함하지 말 것 (`.env.local` 또는 환경변수 사용)
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 git에 커밋되지 않음
- 상세 PRD는 `docs/prompts/chrome-agent-prd.md` 참조
