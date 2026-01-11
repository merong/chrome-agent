package com.chromeagent.message;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.time.Instant;
import java.util.UUID;

/**
 * Factory for creating properly formatted Message instances.
 */
public class MessageFactory {
    private static final ObjectMapper mapper = new ObjectMapper();

    private MessageFactory() {
        // Utility class
    }

    /**
     * Generate a new unique message ID.
     */
    public static String generateId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Create a CONNECT_ACK message.
     */
    public static Message createConnectAck(String sessionId) {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setType(MessageType.CONNECT_ACK);
        msg.setSource("server");
        msg.setSessionId(sessionId);
        msg.setTimestamp(Instant.now().toString());

        ObjectNode payload = mapper.createObjectNode();
        payload.put("sessionId", sessionId);
        payload.put("status", "connected");
        msg.setPayload(payload);

        return msg;
    }

    /**
     * Create a COMMAND message.
     */
    public static Message createCommand(String requestId, String command, JsonNode params) {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setRequestId(requestId);  // Keep original request ID for correlation
        msg.setType(MessageType.COMMAND);
        msg.setSource("server");
        msg.setTarget("extension");
        msg.setTimestamp(Instant.now().toString());

        ObjectNode payload = mapper.createObjectNode();
        payload.put("command", command);
        if (params != null) {
            payload.set("params", params);
        }
        msg.setPayload(payload);

        return msg;
    }

    /**
     * Create a HEARTBEAT message.
     */
    public static Message createHeartbeat() {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setType(MessageType.HEARTBEAT);
        msg.setSource("server");
        msg.setTimestamp(Instant.now().toString());
        return msg;
    }

    /**
     * Create an ERROR message.
     */
    public static Message createError(String errorCode, String errorMessage) {
        return createError(errorCode, errorMessage, null);
    }

    /**
     * Create an ERROR message with request ID for correlation.
     */
    public static Message createError(String errorCode, String errorMessage, String requestId) {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setRequestId(requestId);
        msg.setType(MessageType.ERROR);
        msg.setSource("server");
        msg.setTimestamp(Instant.now().toString());

        ObjectNode payload = mapper.createObjectNode();
        payload.put("error", errorCode);
        payload.put("message", errorMessage);
        msg.setPayload(payload);

        return msg;
    }

    /**
     * Create a STATUS message.
     */
    public static Message createStatus(String status, String description) {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setType(MessageType.STATUS);
        msg.setSource("server");
        msg.setTimestamp(Instant.now().toString());

        ObjectNode payload = mapper.createObjectNode();
        payload.put("status", status);
        payload.put("description", description);
        msg.setPayload(payload);

        return msg;
    }

    /**
     * Create a pairing complete status message.
     */
    public static Message createPairingComplete(String pairedSessionId) {
        Message msg = new Message();
        msg.setMessageId(generateId());
        msg.setType(MessageType.STATUS);
        msg.setSource("server");
        msg.setTimestamp(Instant.now().toString());

        ObjectNode payload = mapper.createObjectNode();
        payload.put("status", "paired");
        payload.put("pairedSessionId", pairedSessionId);
        msg.setPayload(payload);

        return msg;
    }
}
