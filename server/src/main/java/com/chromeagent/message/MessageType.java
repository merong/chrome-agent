package com.chromeagent.message;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * WebSocket message types as defined in PRD Section 5.2.
 */
public enum MessageType {
    CONNECT("CONNECT"),           // Client -> Server: Connection request
    CONNECT_ACK("CONNECT_ACK"),   // Server -> Client: Connection acknowledgment
    COMMAND("COMMAND"),           // Server -> Extension: Execute command
    RESPONSE("RESPONSE"),         // Extension -> Server: Command result
    CHAT("CHAT"),                 // Agent <-> Server: Chat message (triggers AI)
    STATUS("STATUS"),             // Any -> Any: Status change notification
    HEARTBEAT("HEARTBEAT"),       // Both: Keep-alive ping
    ERROR("ERROR");               // Any -> Any: Error notification

    private final String value;

    MessageType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public static MessageType fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (MessageType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}
