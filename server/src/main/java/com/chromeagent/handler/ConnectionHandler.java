package com.chromeagent.handler;

import com.chromeagent.session.SessionManager;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Handles WebSocket connection lifecycle events.
 * Manages handshake completion and channel inactive events.
 */
public class ConnectionHandler extends ChannelInboundHandlerAdapter {
    private static final Logger logger = LoggerFactory.getLogger(ConnectionHandler.class);

    private final SessionManager sessionManager;

    public ConnectionHandler(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof WebSocketServerProtocolHandler.HandshakeComplete handshake) {
            logger.info("WebSocket handshake completed: {} (path: {})",
                    ctx.channel().id(), handshake.requestUri());
            // Note: Session creation is deferred until CONNECT message is received
            // to properly determine client type (agent/extension)
        }
        super.userEventTriggered(ctx, evt);
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        logger.info("Channel inactive: {}", ctx.channel().id());
        sessionManager.handleDisconnect(ctx.channel());
        super.channelInactive(ctx);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        logger.error("Connection error on channel {}: {}",
                ctx.channel().id(), cause.getMessage(), cause);
        ctx.close();
    }
}
