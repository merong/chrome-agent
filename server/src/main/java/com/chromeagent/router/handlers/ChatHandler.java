package com.chromeagent.router.handlers;

import com.chromeagent.ai.AIService;
import com.chromeagent.error.ErrorCode;
import com.chromeagent.error.ErrorHandler;
import com.chromeagent.message.*;
import com.chromeagent.router.RequestTracker;
import com.chromeagent.session.Session;
import com.chromeagent.session.SessionManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * Handles CHAT messages from agents.
 * 1. Calls AI service to convert natural language to command
 * 2. Routes the command to the paired extension
 * 3. Tracks the request for response correlation
 */
public class ChatHandler implements MessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(ChatHandler.class);

    private final AIService aiService;
    private final SessionManager sessionManager;
    private final RequestTracker requestTracker;
    private final ErrorHandler errorHandler;
    private final MessageCodec codec;

    public ChatHandler(AIService aiService, SessionManager sessionManager, RequestTracker requestTracker) {
        this.aiService = aiService;
        this.sessionManager = sessionManager;
        this.requestTracker = requestTracker;
        this.errorHandler = ErrorHandler.getInstance();
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void handle(Session session, Message message) {
        logger.info("Processing CHAT from session: {}", session.getSessionId());

        // Validate payload
        JsonNode payload = message.getPayload();
        if (payload == null || !payload.has("text")) {
            errorHandler.sendError(
                    session.getChannel(),
                    ErrorCode.INVALID_MESSAGE,
                    "CHAT message must contain 'text' in payload",
                    message.getMessageId()
            );
            return;
        }

        String text = payload.get("text").asText();
        if (text == null || text.isBlank()) {
            errorHandler.sendError(
                    session.getChannel(),
                    ErrorCode.INVALID_MESSAGE,
                    "CHAT text cannot be empty",
                    message.getMessageId()
            );
            return;
        }

        // Get paired extension
        Optional<Session> pairedExtension = sessionManager.getPairedSession(session);
        if (pairedExtension.isEmpty() || !pairedExtension.get().isActive()) {
            errorHandler.sendError(
                    session.getChannel(),
                    ErrorCode.NO_EXTENSION_CONNECTED,
                    "No active extension paired with this agent",
                    message.getMessageId()
            );
            return;
        }

        Session extension = pairedExtension.get();
        String requestId = message.getMessageId(); // Use original message ID for correlation

        // Call AI service asynchronously
        CompletableFuture.supplyAsync(() -> aiService.processNaturalLanguage(text))
                .thenAccept(aiResult -> {
                    if (aiResult.has("error")) {
                        errorHandler.sendError(
                                session.getChannel(),
                                ErrorCode.AI_ERROR,
                                aiResult.get("error").asText(),
                                requestId
                        );
                        return;
                    }

                    // Extract command from AI result
                    String command = aiResult.has("command") ?
                            aiResult.get("command").asText() : "UNKNOWN";
                    JsonNode params = aiResult.has("params") ?
                            aiResult.get("params") : null;

                    // Create COMMAND message
                    Message cmdMessage = MessageFactory.createCommand(requestId, command, params);
                    cmdMessage.setSessionId(extension.getSessionId());

                    // Track the request for response routing
                    requestTracker.trackRequest(
                            requestId,
                            session.getChannel(),
                            session.getSessionId(),
                            MessageType.CHAT
                    );

                    // Send to extension
                    extension.getChannel().writeAndFlush(
                            new TextWebSocketFrame(codec.encode(cmdMessage))
                    );

                    logger.info("COMMAND sent to extension: {} (requestId: {})",
                            command, requestId);

                    // Optionally notify agent that command was sent
                    sendCommandSentAck(session, requestId, command);
                })
                .exceptionally(ex -> {
                    logger.error("Error processing CHAT message", ex);
                    errorHandler.sendError(
                            session.getChannel(),
                            ErrorCode.INTERNAL_ERROR,
                            "Failed to process chat message: " + ex.getMessage(),
                            requestId
                    );
                    return null;
                });
    }

    /**
     * Send acknowledgment to agent that command was sent to extension.
     */
    private void sendCommandSentAck(Session session, String requestId, String command) {
        Message statusMsg = MessageFactory.createStatus("command_sent",
                "Command '" + command + "' sent to extension");
        statusMsg.setRequestId(requestId);
        statusMsg.setSessionId(session.getSessionId());

        session.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(statusMsg)));
    }
}
