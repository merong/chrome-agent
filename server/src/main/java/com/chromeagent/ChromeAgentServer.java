package com.chromeagent;

import com.chromeagent.config.ConfigLoader;
import com.chromeagent.config.ServerConfig;
import com.chromeagent.server.NettyWebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Chrome Agent Server - Main entry point.
 *
 * Required environment variables:
 * - CLAUDE_API_KEY: Claude API key for AI processing
 *
 * Optional environment variables:
 * - CHROME_AGENT_PORT: Server port (default: 8080)
 * - CLAUDE_MODEL: Claude model to use (default: claude-sonnet-4-20250514)
 * - HEARTBEAT_INTERVAL_SECONDS: Heartbeat interval (default: 10)
 * - SESSION_RETENTION_SECONDS: Session retention after disconnect (default: 30)
 * - COMMAND_TIMEOUT_SECONDS: Command execution timeout (default: 30)
 */
public class ChromeAgentServer {
    private static final Logger logger = LoggerFactory.getLogger(ChromeAgentServer.class);

    public static void main(String[] args) {
        logger.info("Starting Chrome Agent Server...");

        try {
            // Load configuration from environment variables
            ServerConfig config = ConfigLoader.load();

            // Create and start server
            NettyWebSocketServer server = new NettyWebSocketServer(config);
            server.start();

        } catch (IllegalStateException e) {
            // Configuration error (e.g., missing API key)
            logger.error("Configuration error: {}", e.getMessage());
            logger.error("Please set the required environment variables and try again.");
            System.exit(1);

        } catch (InterruptedException e) {
            logger.info("Server interrupted");
            Thread.currentThread().interrupt();

        } catch (Exception e) {
            logger.error("Failed to start server", e);
            System.exit(1);
        }
    }
}
