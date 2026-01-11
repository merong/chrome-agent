package com.chromeagent.router.handlers;

import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.router.RequestTracker;
import com.chromeagent.session.Session;
import io.netty.channel.Channel;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Handles RESPONSE messages from extensions.
 * Uses RequestTracker to route responses back to the correct agent.
 */
public class ResponseHandler implements MessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(ResponseHandler.class);

    private final RequestTracker requestTracker;
    private final MessageCodec codec;

    public ResponseHandler(RequestTracker requestTracker) {
        this.requestTracker = requestTracker;
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void handle(Session session, Message message) {
        String requestId = message.getRequestId();

        if (requestId == null || requestId.isBlank()) {
            logger.warn("RESPONSE without requestId from session: {}", session.getSessionId());
            return;
        }

        logger.info("Processing RESPONSE for requestId: {} from session: {}",
                requestId, session.getSessionId());

        // Look up the original requester
        Optional<RequestTracker.PendingRequest> pending = requestTracker.completeRequest(requestId);

        if (pending.isEmpty()) {
            logger.warn("No pending request found for requestId: {} (may have timed out)", requestId);
            return;
        }

        RequestTracker.PendingRequest request = pending.get();
        Channel agentChannel = request.getSourceChannel();

        // Verify channel is still active
        if (agentChannel == null || !agentChannel.isActive()) {
            logger.warn("Agent channel is no longer active for requestId: {}", requestId);
            return;
        }

        // Update message target and forward to agent
        message.setTarget("agent");

        agentChannel.writeAndFlush(new TextWebSocketFrame(codec.encode(message)));

        logger.info("RESPONSE forwarded to agent for requestId: {}", requestId);
    }
}
