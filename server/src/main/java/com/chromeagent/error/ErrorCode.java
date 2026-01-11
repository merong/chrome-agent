package com.chromeagent.error;

/**
 * Error codes as defined in PRD Section 5.3.
 */
public enum ErrorCode {
    ELEMENT_NOT_FOUND("ELEMENT_NOT_FOUND", "No element matches the selector"),
    PERMISSION_DENIED("PERMISSION_DENIED", "Page access permission denied"),
    TIMEOUT("TIMEOUT", "Command execution timed out"),
    INVALID_SELECTOR("INVALID_SELECTOR", "Invalid CSS selector"),
    INVALID_COMMAND("INVALID_COMMAND", "Unknown command type"),
    INVALID_MESSAGE("INVALID_MESSAGE", "Invalid message format"),
    CONNECTION_LOST("CONNECTION_LOST", "WebSocket connection lost"),
    SESSION_EXPIRED("SESSION_EXPIRED", "Session has expired"),
    NO_EXTENSION_CONNECTED("NO_EXTENSION_CONNECTED", "No Chrome extension connected"),
    NO_AGENT_CONNECTED("NO_AGENT_CONNECTED", "No command agent connected"),
    NOT_PAIRED("NOT_PAIRED", "Session is not paired"),
    AI_ERROR("AI_ERROR", "AI service error"),
    INTERNAL_ERROR("INTERNAL_ERROR", "Internal server error");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
