package com.chromeagent.router.handlers;

import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageFactory;
import com.chromeagent.session.Session;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Handles CONNECT messages.
 * Sends CONNECT_ACK back to the client.
 */
public class ConnectHandler implements MessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(ConnectHandler.class);
    private final MessageCodec codec;

    public ConnectHandler() {
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void handle(Session session, Message message) {
        logger.info("Processing CONNECT from {} (session: {})",
                message.getSource(), session.getSessionId());

        // Send CONNECT_ACK
        Message ack = MessageFactory.createConnectAck(session.getSessionId());
        ack.setTarget(message.getSource());

        session.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(ack)));

        logger.debug("CONNECT_ACK sent to session: {}", session.getSessionId());
    }
}
