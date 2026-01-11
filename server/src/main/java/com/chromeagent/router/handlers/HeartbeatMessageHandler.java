package com.chromeagent.router.handlers;

import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageFactory;
import com.chromeagent.session.Session;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Handles HEARTBEAT messages.
 * Responds with a HEARTBEAT to keep the connection alive.
 */
public class HeartbeatMessageHandler implements MessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(HeartbeatMessageHandler.class);
    private final MessageCodec codec;

    public HeartbeatMessageHandler() {
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void handle(Session session, Message message) {
        logger.trace("Heartbeat received from session: {}", session.getSessionId());

        // Update session activity
        session.updateActivity();

        // Respond with heartbeat
        Message heartbeat = MessageFactory.createHeartbeat();
        heartbeat.setSessionId(session.getSessionId());

        session.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(heartbeat)));
    }
}
