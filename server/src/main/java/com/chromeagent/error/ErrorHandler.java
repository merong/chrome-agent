package com.chromeagent.error;

import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageFactory;
import io.netty.channel.Channel;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Centralized error handler that actually sends error messages to clients.
 * Unlike the previous implementation, this one actually sends the error!
 */
public class ErrorHandler {
    private static final Logger logger = LoggerFactory.getLogger(ErrorHandler.class);
    private static final ErrorHandler INSTANCE = new ErrorHandler();

    private final MessageCodec codec;

    private ErrorHandler() {
        this.codec = MessageCodec.getInstance();
    }

    public static ErrorHandler getInstance() {
        return INSTANCE;
    }

    /**
     * Send an error message to a channel.
     *
     * @param channel Channel to send the error to
     * @param errorCode Error code enum
     * @param message Error description
     */
    public void sendError(Channel channel, ErrorCode errorCode, String message) {
        sendError(channel, errorCode, message, null);
    }

    /**
     * Send an error message to a channel with request ID for correlation.
     *
     * @param channel Channel to send the error to
     * @param errorCode Error code enum
     * @param message Error description
     * @param requestId Original request ID for correlation
     */
    public void sendError(Channel channel, ErrorCode errorCode, String message, String requestId) {
        if (channel == null) {
            logger.warn("Cannot send error - channel is null: {} - {}", errorCode.getCode(), message);
            return;
        }

        if (!channel.isActive()) {
            logger.warn("Cannot send error - channel is inactive: {} - {}", errorCode.getCode(), message);
            return;
        }

        Message errorMessage = MessageFactory.createError(errorCode.getCode(), message, requestId);
        String json = codec.encode(errorMessage);

        channel.writeAndFlush(new TextWebSocketFrame(json))
                .addListener(future -> {
                    if (future.isSuccess()) {
                        logger.debug("Error sent to client: {} - {}", errorCode.getCode(), message);
                    } else {
                        logger.error("Failed to send error to client: {} - {}",
                                errorCode.getCode(), message, future.cause());
                    }
                });

        logger.error("Error response: [{}] {} (requestId: {})",
                errorCode.getCode(), message, requestId);
    }

    /**
     * Send an error using the default message for the error code.
     *
     * @param channel Channel to send the error to
     * @param errorCode Error code enum
     */
    public void sendError(Channel channel, ErrorCode errorCode) {
        sendError(channel, errorCode, errorCode.getDefaultMessage());
    }
}
