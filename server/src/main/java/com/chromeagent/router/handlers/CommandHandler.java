package com.chromeagent.router.handlers;

import com.chromeagent.error.ErrorCode;
import com.chromeagent.error.ErrorHandler;
import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageType;
import com.chromeagent.router.RequestTracker;
import com.chromeagent.session.Session;
import com.chromeagent.session.SessionManager;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Handles COMMAND messages (direct command forwarding without AI processing).
 * Routes commands from agent directly to paired extension.
 */
public class CommandHandler implements MessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(CommandHandler.class);

    private final SessionManager sessionManager;
    private final RequestTracker requestTracker;
    private final ErrorHandler errorHandler;
    private final MessageCodec codec;

    public CommandHandler(SessionManager sessionManager, RequestTracker requestTracker) {
        this.sessionManager = sessionManager;
        this.requestTracker = requestTracker;
        this.errorHandler = ErrorHandler.getInstance();
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void handle(Session session, Message message) {
        logger.info("Processing COMMAND from session: {}", session.getSessionId());

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
        String requestId = message.getMessageId();

        // Track the request for response routing
        requestTracker.trackRequest(
                requestId,
                session.getChannel(),
                session.getSessionId(),
                MessageType.COMMAND
        );

        // Update message target and forward
        message.setTarget("extension");
        message.setSessionId(extension.getSessionId());

        extension.getChannel().writeAndFlush(
                new TextWebSocketFrame(codec.encode(message))
        );

        logger.debug("COMMAND forwarded to extension: {} (requestId: {})",
                extension.getSessionId(), requestId);
    }
}
