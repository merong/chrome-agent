# Chrome Agent 확장 프로그램 명령어 처리 시나리오

> **문서 버전:** 1.0
> **작성일:** 2025-01-11
> **관련 문서:** chrome-agent-prd.md, chrome-agent-ui-ux-spec.md

---

## 목차

1. [개요](#1-개요)
2. [패킷 구조](#2-패킷-구조)
3. [명령어별 시나리오](#3-명령어별-시나리오)
4. [에러 처리](#4-에러-처리)
5. [디버깅 가이드](#5-디버깅-가이드)

---

## 1. 개요

### 1.1 확장 프로그램 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
│                                                               │
│  ┌─────────────────┐     ┌──────────────────────────────┐   │
│  │  Side Panel UI  │◄───►│     Service Worker           │   │
│  │ (sidepanel.js)  │     │   (background/service-       │   │
│  └─────────────────┘     │     worker.js)               │   │
│                          │                              │   │
│                          │  • WebSocket 연결 관리        │   │
│                          │  • 서버 메시지 처리           │   │
│                          │  • EXTRACT_COOKIES 실행      │   │
│                          │  • Content Script 통신       │   │
│                          └──────────────┬───────────────┘   │
│                                         │                    │
│                                         │ chrome.tabs.       │
│                                         │ sendMessage()      │
│                                         ▼                    │
│                          ┌──────────────────────────────┐   │
│                          │     Content Script           │   │
│                          │   (content/content-          │   │
│                          │     script.js)               │   │
│                          │                              │   │
│                          │  • EXTRACT_DOM 실행          │   │
│                          │  • EXTRACT_FORM 실행         │   │
│                          │  • GET_PAGE_INFO 실행        │   │
│                          │  • DOM 접근 및 조작           │   │
│                          └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
                    ┌─────────────────────┐
                    │   Netty Server      │
                    │  (Java, Port 8080)  │
                    └─────────────────────┘
```

### 1.2 메시지 흐름

```
서버 → Extension (COMMAND)
    ↓
Service Worker
    ├─ EXTRACT_COOKIES → Chrome Cookies API
    ├─ EXTRACT_DOM → Content Script
    ├─ EXTRACT_FORM → Content Script
    └─ GET_PAGE_INFO → Content Script
    ↓
Extension → 서버 (RESPONSE)
```

---

## 2. 패킷 구조

### 2.1 서버 → Extension (COMMAND)

```json
{
  "messageId": "cmd-uuid-123",
  "requestId": "original-chat-uuid",
  "type": "COMMAND",
  "source": "server",
  "target": "extension",
  "sessionId": "ext-session-uuid",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "payload": {
    "command": "EXTRACT_FORM",
    "params": {
      "formSelector": "form[action*='login']"
    }
  }
}
```

| 필드 | 설명 |
|------|------|
| `messageId` | 이 COMMAND 메시지의 고유 ID |
| `requestId` | **원래 CHAT 요청의 ID (상관관계 추적용)** |
| `payload.command` | 실행할 명령 (EXTRACT_COOKIES, EXTRACT_DOM 등) |
| `payload.params` | 명령별 파라미터 |

### 2.2 Extension → 서버 (RESPONSE)

```json
{
  "messageId": "resp-uuid-456",
  "requestId": "original-chat-uuid",
  "type": "RESPONSE",
  "source": "extension",
  "target": "agent",
  "timestamp": "2025-01-11T12:00:01.000Z",
  "payload": {
    "success": true,
    "data": {
      "fields": [...],
      "fieldCount": 3
    }
  }
}
```

| 필드 | 설명 |
|------|------|
| `messageId` | 이 RESPONSE 메시지의 고유 ID |
| `requestId` | **서버가 보낸 requestId를 그대로 반환** |
| `payload.success` | 명령 실행 성공 여부 |
| `payload.data` | 성공 시 결과 데이터 |
| `payload.error` | 실패 시 에러 정보 |

### 2.3 중요: requestId 처리

```javascript
// ✅ 올바른 방법 (service-worker.js)
const requestId = originalMsg.requestId || originalMsg.messageId;

// ❌ 잘못된 방법
const requestId = originalMsg.messageId;  // COMMAND의 ID가 사용됨
```

서버의 `RequestTracker`가 응답을 원래 요청자에게 라우팅하려면, Extension이 서버가 보낸 `requestId`를 그대로 반환해야 합니다.

---

## 3. 명령어별 시나리오

### 3.1 EXTRACT_COOKIES

#### 목적
현재 브라우저의 쿠키를 추출합니다.

#### 처리 위치
`service-worker.js` (Chrome Cookies API 사용)

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `domain` | string | No | 특정 도메인의 쿠키만 추출 |

#### 시나리오 흐름

```
1. 서버 → COMMAND (EXTRACT_COOKIES)
   {
     "payload": {
       "command": "EXTRACT_COOKIES",
       "params": { "domain": "example.com" }
     }
   }

2. Service Worker 처리
   [EXTRACT_COOKIES] Starting cookie extraction
   ├─ chrome.cookies.getAll({ domain: "example.com" })
   └─ 결과: cookies 배열

3. Extension → RESPONSE
   {
     "payload": {
       "success": true,
       "data": {
         "cookies": [
           { "name": "session", "value": "abc123", "domain": ".example.com", ... }
         ],
         "count": 1
       }
     }
   }
```

#### 로그 예시

```
[MESSAGE] Received from server: { type: 'COMMAND', messageId: 'cmd-123', requestId: 'req-001' }
[COMMAND] Received: { command: 'EXTRACT_COOKIES', requestId: 'req-001' }
[COMMAND] Routing to: handleExtractCookies
[EXTRACT_COOKIES] Starting cookie extraction: { domain: 'example.com' }
[EXTRACT_COOKIES] Cookies retrieved: { count: 5, domains: ['.example.com'] }
[RESPONSE] Sending success response: { requestId: 'req-001' }
[RESPONSE] Success response sent
```

#### 에러 케이스

| 에러 코드 | 원인 | 해결 방법 |
|-----------|------|----------|
| `COOKIE_ERROR` | Chrome API 오류 | 권한 확인 (`cookies` permission) |

---

### 3.2 EXTRACT_DOM

#### 목적
CSS 선택자로 DOM 요소를 추출합니다.

#### 처리 위치
`content-script.js` (DOM 접근 필요)

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `selector` | string | **Yes** | CSS 선택자 |
| `extractType` | string | No | `html`, `text`, `attribute`, `all` (기본값: `all`) |
| `multiple` | boolean | No | 여러 요소 선택 (기본값: `false`) |
| `attributes` | string[] | No | 추출할 특정 속성 목록 |

#### 시나리오 흐름

```
1. 서버 → COMMAND (EXTRACT_DOM)
   {
     "payload": {
       "command": "EXTRACT_DOM",
       "params": {
         "selector": ".product-item",
         "extractType": "all",
         "multiple": true
       }
     }
   }

2. Service Worker
   [COMMAND] Routing to: handleContentScriptCommand (EXTRACT_DOM)
   ├─ chrome.tabs.query() → 활성 탭 조회
   └─ chrome.tabs.sendMessage() → Content Script로 전달

3. Content Script 처리
   [EXTRACT_DOM] Starting with selector: .product-item
   ├─ document.querySelectorAll(".product-item")
   ├─ 각 요소에서 tagName, rect, html, text, attributes 추출
   └─ 결과 반환

4. Extension → RESPONSE
   {
     "payload": {
       "success": true,
       "data": {
         "elements": [
           {
             "tagName": "DIV",
             "rect": { "x": 100, "y": 200, "width": 300, "height": 150 },
             "html": "<div class=\"product-item\">...</div>",
             "text": "상품명",
             "attributes": { "class": "product-item", "data-id": "123" }
           }
         ],
         "count": 5,
         "selector": ".product-item"
       }
     }
   }
```

#### 로그 예시

```
[CONTENT_SCRIPT] Starting command execution: { command: 'EXTRACT_DOM' }
[CONTENT_SCRIPT] Active tab found: { tabId: 123, url: 'https://example.com' }
[CONTENT_SCRIPT] Sending message to content script...
[Content Script] Message received: { type: 'EXECUTE_COMMAND', command: 'EXTRACT_DOM' }
[EXTRACT_DOM] Starting with selector: .product-item
[EXTRACT_DOM] Result: { count: 5, hasError: false }
[CONTENT_SCRIPT] Command executed successfully
```

#### 에러 케이스

| 에러 코드 | 원인 | 해결 방법 |
|-----------|------|----------|
| `INVALID_SELECTOR` | 선택자가 없거나 문법 오류 | 유효한 CSS 선택자 확인 |
| `ELEMENT_NOT_FOUND` | 선택자와 일치하는 요소 없음 | 선택자 또는 페이지 확인 |
| `NO_ACTIVE_TAB` | 활성 탭 없음 | 브라우저 창 확인 |
| `CONTENT_SCRIPT_NOT_LOADED` | Content Script 미로드 | 페이지 새로고침 |

---

### 3.3 EXTRACT_FORM

#### 목적
폼 요소의 필드 정보를 추출합니다.

#### 처리 위치
`content-script.js` (DOM 접근 필요)

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `formSelector` | string | **Yes** | 폼 요소의 CSS 선택자 |
| `includeHidden` | boolean | No | 숨김 필드 포함 여부 (기본값: `true`) |

#### 시나리오 흐름

```
1. 서버 → COMMAND (EXTRACT_FORM)
   {
     "payload": {
       "command": "EXTRACT_FORM",
       "params": {
         "formSelector": "form[action*='login']"
       }
     }
   }

2. Content Script 처리
   [EXTRACT_FORM] Starting with selector: form[action*='login']
   ├─ document.querySelector("form[action*='login']")
   ├─ form.elements에서 각 필드 정보 추출
   │   └─ name, type, value, id
   └─ form.action, form.method 추출

3. Extension → RESPONSE
   {
     "payload": {
       "success": true,
       "data": {
         "form": {
           "action": "https://example.com/api/auth/login",
           "method": "POST"
         },
         "fields": [
           { "name": "username", "type": "text", "value": "", "id": "username" },
           { "name": "password", "type": "password", "value": "", "id": "password" },
           { "name": "_csrf", "type": "hidden", "value": "token123", "id": "" }
         ],
         "fieldCount": 3
       }
     }
   }
```

#### 로그 예시

```
[Content Script] Executing command: { command: 'EXTRACT_FORM' }
[EXTRACT_FORM] Starting with selector: form[action*='login']
[EXTRACT_FORM] Result: { fieldCount: 3, hasError: false }
```

#### 에러 케이스

| 에러 코드 | 원인 | 해결 방법 |
|-----------|------|----------|
| `ELEMENT_NOT_FOUND` | 폼을 찾을 수 없음 | 선택자 확인, 페이지 로드 완료 확인 |

---

### 3.4 GET_PAGE_INFO

#### 목적
현재 페이지의 기본 정보를 조회합니다.

#### 처리 위치
`content-script.js`

#### 파라미터
없음

#### 시나리오 흐름

```
1. 서버 → COMMAND (GET_PAGE_INFO)
   {
     "payload": {
       "command": "GET_PAGE_INFO",
       "params": {}
     }
   }

2. Content Script 처리
   [GET_PAGE_INFO] Starting...
   ├─ window.location.href
   ├─ document.title
   └─ window.location.hostname

3. Extension → RESPONSE
   {
     "payload": {
       "success": true,
       "data": {
         "url": "https://example.com/login",
         "title": "Login - Example Site",
         "domain": "example.com"
       }
     }
   }
```

#### 로그 예시

```
[Content Script] Executing command: { command: 'GET_PAGE_INFO' }
[GET_PAGE_INFO] Starting...
[GET_PAGE_INFO] Result: { url: 'https://example.com/login', title: 'Login', domain: 'example.com' }
```

---

## 4. 에러 처리

### 4.1 에러 응답 구조

```json
{
  "type": "RESPONSE",
  "requestId": "original-request-id",
  "payload": {
    "success": false,
    "error": {
      "code": "ELEMENT_NOT_FOUND",
      "message": "Form not found"
    }
  }
}
```

### 4.2 에러 코드 목록

| 에러 코드 | 설명 | 발생 위치 |
|-----------|------|----------|
| `UNKNOWN_COMMAND` | 알 수 없는 명령 | Service Worker |
| `NO_ACTIVE_TAB` | 활성 탭 없음 | Service Worker |
| `TAB_QUERY_ERROR` | 탭 조회 실패 | Service Worker |
| `CONTENT_SCRIPT_NOT_LOADED` | Content Script 미로드 | Service Worker |
| `CONTENT_SCRIPT_ERROR` | Content Script 통신 오류 | Service Worker |
| `EMPTY_RESPONSE` | 빈 응답 | Service Worker |
| `COOKIE_ERROR` | 쿠키 API 오류 | Service Worker |
| `INVALID_SELECTOR` | 잘못된 CSS 선택자 | Content Script |
| `ELEMENT_NOT_FOUND` | 요소를 찾을 수 없음 | Content Script |
| `EXECUTION_ERROR` | 실행 중 예외 발생 | Content Script |

### 4.3 에러 복구 전략

```
Content Script 미로드
└─ "Please refresh the page" 메시지 표시
└─ 페이지 새로고침 후 재시도

요소를 찾을 수 없음
└─ 선택자 확인
└─ 페이지 로드 완료 후 재시도
└─ 다른 선택자 시도

WebSocket 연결 끊김
└─ 자동 재연결 시도 (최대 3회)
└─ 30초 세션 유지 내 재연결 가능
```

---

## 5. 디버깅 가이드

### 5.1 로그 확인 방법

#### Service Worker 로그
1. `chrome://extensions` 접속
2. Chrome Agent 확장 프로그램의 "Service Worker" 링크 클릭
3. DevTools Console에서 `[MESSAGE]`, `[COMMAND]`, `[RESPONSE]` 로그 확인

#### Content Script 로그
1. 대상 웹 페이지에서 DevTools 열기 (F12)
2. Console 탭에서 `[Content Script]`, `[EXTRACT_DOM]` 등의 로그 확인

### 5.2 로그 태그 설명

| 태그 | 설명 |
|------|------|
| `[MESSAGE]` | 서버로부터 수신한 메시지 |
| `[COMMAND]` | 명령 수신 및 라우팅 |
| `[EXTRACT_COOKIES]` | 쿠키 추출 처리 |
| `[CONTENT_SCRIPT]` | Content Script 통신 |
| `[RESPONSE]` | 서버로 응답 전송 |
| `[Content Script]` | Content Script 내부 처리 |
| `[EXTRACT_DOM]` | DOM 추출 처리 |
| `[EXTRACT_FORM]` | 폼 추출 처리 |
| `[GET_PAGE_INFO]` | 페이지 정보 조회 |

### 5.3 일반적인 문제 해결

#### 문제: 명령이 실행되지 않음

```
체크리스트:
1. WebSocket 연결 상태 확인 (Side Panel에서 확인)
2. Service Worker 로그에서 [COMMAND] 수신 확인
3. [CONTENT_SCRIPT] 라우팅 로그 확인
4. Content Script 로그에서 메시지 수신 확인
```

#### 문제: 응답이 Agent에 도달하지 않음

```
체크리스트:
1. [RESPONSE] 로그에서 requestId 확인
2. requestId가 서버가 보낸 값과 일치하는지 확인
3. WebSocket 연결 상태 확인
```

#### 문제: "Receiving end does not exist" 에러

```
원인: Content Script가 페이지에 로드되지 않음

해결:
1. 페이지 새로고침
2. 확장 프로그램 새로고침 (chrome://extensions)
3. manifest.json의 content_scripts 설정 확인
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-01-11 | 최초 작성 |
