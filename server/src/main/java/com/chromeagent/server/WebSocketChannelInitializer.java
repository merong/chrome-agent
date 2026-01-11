package com.chromeagent.server;

import com.chromeagent.config.ServerConfig;
import com.chromeagent.handler.ConnectionHandler;
import com.chromeagent.handler.HeartbeatHandler;
import com.chromeagent.handler.WebSocketFrameHandler;
import com.chromeagent.router.MessageRouter;
import com.chromeagent.session.SessionManager;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler;
import io.netty.handler.stream.ChunkedWriteHandler;
import io.netty.handler.timeout.IdleStateHandler;

import java.util.concurrent.TimeUnit;

/**
 * Initializes the channel pipeline for WebSocket connections.
 */
public class WebSocketChannelInitializer extends ChannelInitializer<SocketChannel> {
    private final ServerConfig config;
    private final MessageRouter router;
    private final SessionManager sessionManager;

    public WebSocketChannelInitializer(ServerConfig config, MessageRouter router, SessionManager sessionManager) {
        this.config = config;
        this.router = router;
        this.sessionManager = sessionManager;
    }

    @Override
    protected void initChannel(SocketChannel ch) {
        ChannelPipeline pipeline = ch.pipeline();

        // HTTP codec for WebSocket handshake
        pipeline.addLast("httpCodec", new HttpServerCodec());
        pipeline.addLast("httpAggregator", new HttpObjectAggregator(65536));
        pipeline.addLast("chunkedWriter", new ChunkedWriteHandler());

        // WebSocket compression (optional, improves performance)
        pipeline.addLast("wsCompression", new WebSocketServerCompressionHandler());

        // Idle state detection for heartbeat
        // Reader idle: slightly more than heartbeat interval (client should send within this)
        // Writer idle: heartbeat interval (server sends heartbeat)
        int heartbeatInterval = config.getHeartbeatIntervalSeconds();
        pipeline.addLast("idleStateHandler", new IdleStateHandler(
                heartbeatInterval + 5,  // Reader idle (wait a bit longer than heartbeat)
                heartbeatInterval,       // Writer idle (send heartbeat)
                0,                       // All idle (disabled)
                TimeUnit.SECONDS
        ));

        // WebSocket protocol handler
        // Handles handshake, ping/pong, and close frames automatically
        pipeline.addLast("wsProtocol", new WebSocketServerProtocolHandler(
                "/ws",           // WebSocket path
                null,            // Subprotocols (null = any)
                true,            // Allow extensions
                65536,           // Max frame size
                false,           // Allow mask mismatch
                true,            // Check starting slash
                10000L           // Handshake timeout (10 seconds)
        ));

        // Custom handlers
        pipeline.addLast("heartbeat", new HeartbeatHandler(sessionManager));
        pipeline.addLast("connection", new ConnectionHandler(sessionManager));
        pipeline.addLast("websocket", new WebSocketFrameHandler(router, sessionManager));
    }
}
