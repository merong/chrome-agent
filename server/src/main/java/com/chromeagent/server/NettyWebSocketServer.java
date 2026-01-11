package com.chromeagent.server;

import com.chromeagent.ai.AIService;
import com.chromeagent.ai.ClaudeAIService;
import com.chromeagent.config.ServerConfig;
import com.chromeagent.router.MessageRouter;
import com.chromeagent.session.SessionManager;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;

/**
 * Netty WebSocket server with graceful shutdown support.
 */
public class NettyWebSocketServer {
    private static final Logger logger = LoggerFactory.getLogger(NettyWebSocketServer.class);

    private final ServerConfig config;
    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;
    private Channel serverChannel;
    private SessionManager sessionManager;
    private MessageRouter router;

    public NettyWebSocketServer(ServerConfig config) {
        this.config = config;
    }

    /**
     * Start the server and block until shutdown.
     */
    public void start() throws InterruptedException {
        bossGroup = new NioEventLoopGroup(1);
        workerGroup = new NioEventLoopGroup();

        try {
            // Initialize components
            sessionManager = new SessionManager(config);
            AIService aiService = new ClaudeAIService(config);
            router = new MessageRouter(config, sessionManager, aiService);

            // Register shutdown hook
            Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown, "shutdown-hook"));

            // Configure server
            ServerBootstrap bootstrap = new ServerBootstrap()
                    .group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new WebSocketChannelInitializer(config, router, sessionManager))
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childOption(ChannelOption.TCP_NODELAY, true);

            // Bind and start
            serverChannel = bootstrap.bind(config.getPort()).sync().channel();

            logger.info("========================================");
            logger.info("Chrome Agent Server started");
            logger.info("Port: {}", config.getPort());
            logger.info("WebSocket endpoint: ws://localhost:{}/ws", config.getPort());
            logger.info("Heartbeat interval: {}s", config.getHeartbeatIntervalSeconds());
            logger.info("Session retention: {}s", config.getSessionRetentionSeconds());
            logger.info("========================================");

            // Wait for server channel to close
            serverChannel.closeFuture().sync();

        } finally {
            shutdown();
        }
    }

    /**
     * Gracefully shutdown the server.
     */
    public void shutdown() {
        logger.info("Initiating graceful shutdown...");

        try {
            // 1. Stop accepting new connections
            if (serverChannel != null && serverChannel.isOpen()) {
                serverChannel.close().sync();
                logger.info("Server channel closed");
            }

            // 2. Notify all connected clients
            if (sessionManager != null) {
                sessionManager.notifyShutdown();
                logger.info("Clients notified of shutdown");

                // 3. Wait a moment for pending requests
                Thread.sleep(1000);

                // 4. Close all sessions
                sessionManager.closeAllSessions();
                sessionManager.shutdown();
                logger.info("Sessions closed");
            }

            // 5. Shutdown router
            if (router != null) {
                router.shutdown();
                logger.info("Router shutdown");
            }

            // 6. Shutdown event loops
            if (bossGroup != null) {
                bossGroup.shutdownGracefully(0, 5, TimeUnit.SECONDS).sync();
            }
            if (workerGroup != null) {
                workerGroup.shutdownGracefully(0, 5, TimeUnit.SECONDS).sync();
            }

            logger.info("Chrome Agent Server shutdown complete");

        } catch (InterruptedException e) {
            logger.warn("Shutdown interrupted", e);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.error("Error during shutdown", e);
        }
    }

    /**
     * Check if server is running.
     */
    public boolean isRunning() {
        return serverChannel != null && serverChannel.isActive();
    }

    /**
     * Get the bound port.
     */
    public int getPort() {
        return config.getPort();
    }
}
