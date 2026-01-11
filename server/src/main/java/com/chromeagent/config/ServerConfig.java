package com.chromeagent.config;

/**
 * Server configuration holder.
 * All settings are immutable after construction.
 */
public class ServerConfig {
    private final int port;
    private final String claudeApiKey;
    private final String claudeModel;
    private final int heartbeatIntervalSeconds;
    private final int sessionRetentionSeconds;
    private final int commandTimeoutSeconds;
    private final int reconnectMaxRetries;
    private final int reconnectIntervalSeconds;

    private ServerConfig(Builder builder) {
        this.port = builder.port;
        this.claudeApiKey = builder.claudeApiKey;
        this.claudeModel = builder.claudeModel;
        this.heartbeatIntervalSeconds = builder.heartbeatIntervalSeconds;
        this.sessionRetentionSeconds = builder.sessionRetentionSeconds;
        this.commandTimeoutSeconds = builder.commandTimeoutSeconds;
        this.reconnectMaxRetries = builder.reconnectMaxRetries;
        this.reconnectIntervalSeconds = builder.reconnectIntervalSeconds;
    }

    public int getPort() {
        return port;
    }

    public String getClaudeApiKey() {
        return claudeApiKey;
    }

    public String getClaudeModel() {
        return claudeModel;
    }

    public int getHeartbeatIntervalSeconds() {
        return heartbeatIntervalSeconds;
    }

    public int getSessionRetentionSeconds() {
        return sessionRetentionSeconds;
    }

    public int getCommandTimeoutSeconds() {
        return commandTimeoutSeconds;
    }

    public int getReconnectMaxRetries() {
        return reconnectMaxRetries;
    }

    public int getReconnectIntervalSeconds() {
        return reconnectIntervalSeconds;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int port = 8080;
        private String claudeApiKey;
        private String claudeModel = "claude-sonnet-4-20250514";
        private int heartbeatIntervalSeconds = 10;
        private int sessionRetentionSeconds = 30;
        private int commandTimeoutSeconds = 30;
        private int reconnectMaxRetries = 3;
        private int reconnectIntervalSeconds = 5;

        public Builder port(int port) {
            this.port = port;
            return this;
        }

        public Builder claudeApiKey(String claudeApiKey) {
            this.claudeApiKey = claudeApiKey;
            return this;
        }

        public Builder claudeModel(String claudeModel) {
            this.claudeModel = claudeModel;
            return this;
        }

        public Builder heartbeatIntervalSeconds(int heartbeatIntervalSeconds) {
            this.heartbeatIntervalSeconds = heartbeatIntervalSeconds;
            return this;
        }

        public Builder sessionRetentionSeconds(int sessionRetentionSeconds) {
            this.sessionRetentionSeconds = sessionRetentionSeconds;
            return this;
        }

        public Builder commandTimeoutSeconds(int commandTimeoutSeconds) {
            this.commandTimeoutSeconds = commandTimeoutSeconds;
            return this;
        }

        public Builder reconnectMaxRetries(int reconnectMaxRetries) {
            this.reconnectMaxRetries = reconnectMaxRetries;
            return this;
        }

        public Builder reconnectIntervalSeconds(int reconnectIntervalSeconds) {
            this.reconnectIntervalSeconds = reconnectIntervalSeconds;
            return this;
        }

        public ServerConfig build() {
            return new ServerConfig(this);
        }
    }

    @Override
    public String toString() {
        return "ServerConfig{" +
                "port=" + port +
                ", claudeModel='" + claudeModel + '\'' +
                ", heartbeatIntervalSeconds=" + heartbeatIntervalSeconds +
                ", sessionRetentionSeconds=" + sessionRetentionSeconds +
                ", commandTimeoutSeconds=" + commandTimeoutSeconds +
                ", reconnectMaxRetries=" + reconnectMaxRetries +
                ", reconnectIntervalSeconds=" + reconnectIntervalSeconds +
                '}';
    }
}
