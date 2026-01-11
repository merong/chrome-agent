package com.chromeagent.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Loads configuration from .env.local file or environment variables.
 *
 * Priority order:
 * 1. .env.local file (if exists)
 * 2. Environment variables
 */
public class ConfigLoader {
    private static final Logger logger = LoggerFactory.getLogger(ConfigLoader.class);
    private static final String ENV_FILE = ".env.local";

    private static Dotenv dotenv;

    private ConfigLoader() {
        // Utility class
    }

    /**
     * Load configuration from .env.local file or environment variables.
     *
     * @return ServerConfig instance
     * @throws IllegalStateException if required configuration values are not set
     */
    public static ServerConfig load() {
        initDotenv();

        logger.info("Loading server configuration...");

        ServerConfig config = ServerConfig.builder()
                .port(getInt("CHROME_AGENT_PORT", 8080))
                .claudeApiKey(getRequired("CLAUDE_API_KEY"))
                .claudeModel(get("CLAUDE_MODEL", "claude-sonnet-4-20250514"))
                .heartbeatIntervalSeconds(getInt("HEARTBEAT_INTERVAL_SECONDS", 10))
                .sessionRetentionSeconds(getInt("SESSION_RETENTION_SECONDS", 30))
                .commandTimeoutSeconds(getInt("COMMAND_TIMEOUT_SECONDS", 30))
                .reconnectMaxRetries(getInt("RECONNECT_MAX_RETRIES", 3))
                .reconnectIntervalSeconds(getInt("RECONNECT_INTERVAL_SECONDS", 5))
                .build();

        logger.info("Configuration loaded: {}", config);
        return config;
    }

    /**
     * Initialize Dotenv to load .env.local file.
     * Falls back to environment variables if file doesn't exist.
     */
    private static void initDotenv() {
        Path envPath = Path.of(ENV_FILE);

        DotenvBuilder builder = Dotenv.configure()
                .ignoreIfMissing();

        if (Files.exists(envPath)) {
            logger.info("Loading configuration from {} file", ENV_FILE);
            builder.filename(ENV_FILE);
        } else {
            // Try parent directory (when running from build/libs)
            Path parentEnvPath = Path.of("../..", ENV_FILE);
            if (Files.exists(parentEnvPath)) {
                logger.info("Loading configuration from {} file (parent directory)", ENV_FILE);
                builder.directory("../..")
                       .filename(ENV_FILE);
            } else {
                logger.info("No {} file found, using environment variables only", ENV_FILE);
            }
        }

        dotenv = builder.load();
    }

    /**
     * Get a configuration value. Priority: .env.local > environment variable > default.
     */
    private static String get(String key, String defaultValue) {
        // First try dotenv (which includes system env vars)
        String value = dotenv.get(key);

        if (value == null || value.isBlank()) {
            logger.debug("Configuration {} not set, using default: {}", key, defaultValue);
            return defaultValue;
        }
        return value;
    }

    /**
     * Get a required configuration value.
     * @throws IllegalStateException if value is not set
     */
    private static String getRequired(String key) {
        String value = dotenv.get(key);

        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Required configuration not set: " + key +
                    ". Please set it in " + ENV_FILE + " file or as an environment variable.");
        }
        return value;
    }

    /**
     * Get an integer configuration value.
     */
    private static int getInt(String key, int defaultValue) {
        String value = dotenv.get(key);

        if (value == null || value.isBlank()) {
            logger.debug("Configuration {} not set, using default: {}", key, defaultValue);
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            logger.warn("Invalid integer value for {}: {}. Using default: {}", key, value, defaultValue);
            return defaultValue;
        }
    }
}
