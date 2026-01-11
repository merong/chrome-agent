package com.chromeagent.handler;

import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageFactory;
import com.chromeagent.session.Session;
import com.chromeagent.session.SessionManager;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.timeout.IdleState;
import io.netty.handler.timeout.IdleStateEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Handles idle state events for heartbeat functionality.
 * Sends HEARTBEAT messages when writer is idle, closes connection when reader is idle.
 */
public class HeartbeatHandler extends ChannelInboundHandlerAdapter {
    private static final Logger logger = LoggerFactory.getLogger(HeartbeatHandler.class);

    private final SessionManager sessionManager;
    private final MessageCodec codec;

    public HeartbeatHandler(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
        this.codec = MessageCodec.getInstance();
    }

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent idleEvent) {
            switch (idleEvent.state()) {
                case READER_IDLE -> {
                    // No message received for too long - client may be dead
                    logger.warn("Reader idle, closing connection: {}", ctx.channel().id());
                    ctx.close();
                }
                case WRITER_IDLE -> {
                    // Send heartbeat to keep connection alive
                    sendHeartbeat(ctx);
                }
                case ALL_IDLE -> {
                    // Both read and write idle
                    logger.debug("All idle on channel: {}", ctx.channel().id());
                }
            }
        } else {
            super.userEventTriggered(ctx, evt);
        }
    }

    private void sendHeartbeat(ChannelHandlerContext ctx) {
        sessionManager.getSessionByChannel(ctx.channel()).ifPresent(session -> {
            var heartbeat = MessageFactory.createHeartbeat();
            heartbeat.setSessionId(session.getSessionId());
            ctx.writeAndFlush(new TextWebSocketFrame(codec.encode(heartbeat)));
            logger.trace("Heartbeat sent to session: {}", session.getSessionId());
        });
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        logger.error("HeartbeatHandler error on channel {}: {}",
                ctx.channel().id(), cause.getMessage());
        ctx.close();
    }
}
