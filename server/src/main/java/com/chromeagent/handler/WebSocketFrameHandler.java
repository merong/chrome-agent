package com.chromeagent.handler;

import com.chromeagent.error.ErrorCode;
import com.chromeagent.error.ErrorHandler;
import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageType;
import com.chromeagent.router.MessageRouter;
import com.chromeagent.session.ClientType;
import com.chromeagent.session.Session;
import com.chromeagent.session.SessionManager;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Handles incoming WebSocket text frames.
 * Parses messages and routes them to the appropriate handler.
 */
public class WebSocketFrameHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketFrameHandler.class);

    private final MessageRouter router;
    private final SessionManager sessionManager;
    private final MessageCodec codec;
    private final ErrorHandler errorHandler;

    public WebSocketFrameHandler(MessageRouter router, SessionManager sessionManager) {
        this.router = router;
        this.sessionManager = sessionManager;
        this.codec = MessageCodec.getInstance();
        this.errorHandler = ErrorHandler.getInstance();
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame frame) {
        String text = frame.text();
        logger.debug("Received frame: {}", text);

        // Parse message
        Optional<Message> messageOpt = codec.decode(text);
        if (messageOpt.isEmpty()) {
            logger.error("Failed to parse message: {}", text);
            errorHandler.sendError(ctx.channel(), ErrorCode.INVALID_MESSAGE,
                    "Failed to parse message as JSON");
            return;
        }

        Message message = messageOpt.get();

        // Get or create session
        Optional<Session> sessionOpt = sessionManager.getSessionByChannel(ctx.channel());
        Session session;

        if (sessionOpt.isEmpty()) {
            // First message must be CONNECT
            if (message.getType() != MessageType.CONNECT) {
                errorHandler.sendError(ctx.channel(), ErrorCode.INVALID_MESSAGE,
                        "First message must be CONNECT", message.getMessageId());
                return;
            }

            // Determine client type from source field
            ClientType clientType = ClientType.fromValue(message.getSource());
            if (clientType == null) {
                errorHandler.sendError(ctx.channel(), ErrorCode.INVALID_MESSAGE,
                        "CONNECT message must specify source as 'agent' or 'extension'",
                        message.getMessageId());
                return;
            }

            // Create session
            session = sessionManager.createSession(ctx.channel(), clientType);
            logger.info("New session created: {} ({})", session.getSessionId(), clientType);
        } else {
            session = sessionOpt.get();
        }

        // Route message
        router.route(session, message);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        logger.error("WebSocket handler error on channel {}: {}",
                ctx.channel().id(), cause.getMessage(), cause);
        errorHandler.sendError(ctx.channel(), ErrorCode.INTERNAL_ERROR,
                "Server error: " + cause.getMessage());
    }
}
