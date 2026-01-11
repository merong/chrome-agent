package com.chromeagent.router;

import com.chromeagent.ai.AIService;
import com.chromeagent.config.ServerConfig;
import com.chromeagent.error.ErrorCode;
import com.chromeagent.error.ErrorHandler;
import com.chromeagent.message.Message;
import com.chromeagent.message.MessageType;
import com.chromeagent.router.handlers.*;
import com.chromeagent.session.Session;
import com.chromeagent.session.SessionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.EnumMap;
import java.util.Map;

/**
 * Central message router that dispatches messages to appropriate handlers.
 * Thread-safe singleton pattern.
 */
public class MessageRouter {
    private static final Logger logger = LoggerFactory.getLogger(MessageRouter.class);

    private final Map<MessageType, MessageHandler> handlers;
    private final ErrorHandler errorHandler;
    private final RequestTracker requestTracker;

    public MessageRouter(ServerConfig config, SessionManager sessionManager, AIService aiService) {
        this.handlers = new EnumMap<>(MessageType.class);
        this.errorHandler = ErrorHandler.getInstance();
        this.requestTracker = new RequestTracker(config);

        // Register handlers
        registerHandler(MessageType.CONNECT, new ConnectHandler());
        registerHandler(MessageType.CHAT, new ChatHandler(aiService, sessionManager, requestTracker));
        registerHandler(MessageType.COMMAND, new CommandHandler(sessionManager, requestTracker));
        registerHandler(MessageType.RESPONSE, new ResponseHandler(requestTracker));
        registerHandler(MessageType.HEARTBEAT, new HeartbeatMessageHandler());

        logger.info("MessageRouter initialized with {} handlers", handlers.size());
    }

    /**
     * Register a handler for a message type.
     */
    private void registerHandler(MessageType type, MessageHandler handler) {
        handlers.put(type, handler);
        logger.debug("Registered handler for {}: {}", type, handler.getClass().getSimpleName());
    }

    /**
     * Route a message to the appropriate handler.
     *
     * @param session The session that sent the message
     * @param message The message to route
     */
    public void route(Session session, Message message) {
        if (session == null) {
            logger.error("Cannot route message - session is null");
            return;
        }

        if (message == null) {
            logger.error("Cannot route message - message is null");
            errorHandler.sendError(session.getChannel(), ErrorCode.INVALID_MESSAGE,
                    "Message cannot be null");
            return;
        }

        MessageType type = message.getType();
        if (type == null) {
            logger.error("Cannot route message - type is null");
            errorHandler.sendError(session.getChannel(), ErrorCode.INVALID_MESSAGE,
                    "Message type is required", message.getMessageId());
            return;
        }

        MessageHandler handler = handlers.get(type);
        if (handler == null) {
            logger.warn("No handler registered for message type: {}", type);
            errorHandler.sendError(session.getChannel(), ErrorCode.INVALID_COMMAND,
                    "Unknown message type: " + type, message.getMessageId());
            return;
        }

        // Update session activity
        session.updateActivity();

        logger.debug("Routing {} message from session: {}", type, session.getSessionId());

        try {
            handler.handle(session, message);
        } catch (Exception e) {
            logger.error("Error handling message type {}: {}", type, e.getMessage(), e);
            errorHandler.sendError(session.getChannel(), ErrorCode.INTERNAL_ERROR,
                    "Error processing message: " + e.getMessage(), message.getMessageId());
        }
    }

    /**
     * Get the request tracker for external access.
     */
    public RequestTracker getRequestTracker() {
        return requestTracker;
    }

    /**
     * Shutdown the router and its components.
     */
    public void shutdown() {
        requestTracker.shutdown();
        logger.info("MessageRouter shutdown complete");
    }
}
