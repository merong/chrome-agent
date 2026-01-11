package com.chromeagent.session;

import io.netty.channel.Channel;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;

/**
 * Represents a client session (either agent or extension).
 * Thread-safe for concurrent access.
 */
public class Session {
    private final String sessionId;
    private final ClientType clientType;
    private final Instant createdAt;

    private volatile Channel channel;
    private volatile Instant lastActivityAt;
    private volatile SessionState state;
    private volatile String pairedSessionId;
    private volatile ScheduledFuture<?> retentionTask;

    public Session(Channel channel, ClientType clientType) {
        this.sessionId = UUID.randomUUID().toString();
        this.channel = channel;
        this.clientType = clientType;
        this.createdAt = Instant.now();
        this.lastActivityAt = Instant.now();
        this.state = SessionState.CONNECTING;
    }

    public String getSessionId() {
        return sessionId;
    }

    public Channel getChannel() {
        return channel;
    }

    public void setChannel(Channel channel) {
        this.channel = channel;
    }

    public ClientType getClientType() {
        return clientType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public void updateActivity() {
        this.lastActivityAt = Instant.now();
    }

    public SessionState getState() {
        return state;
    }

    public void setState(SessionState state) {
        this.state = state;
    }

    public String getPairedSessionId() {
        return pairedSessionId;
    }

    public void setPairedSessionId(String pairedSessionId) {
        this.pairedSessionId = pairedSessionId;
    }

    public ScheduledFuture<?> getRetentionTask() {
        return retentionTask;
    }

    public void setRetentionTask(ScheduledFuture<?> retentionTask) {
        this.retentionTask = retentionTask;
    }

    /**
     * Check if this session is actively connected.
     */
    public boolean isActive() {
        return channel != null && channel.isActive() &&
               (state == SessionState.CONNECTED || state == SessionState.PAIRED);
    }

    /**
     * Check if this session is paired with another.
     */
    public boolean isPaired() {
        return state == SessionState.PAIRED && pairedSessionId != null;
    }

    /**
     * Cancel the retention task if scheduled.
     */
    public void cancelRetentionTask() {
        if (retentionTask != null && !retentionTask.isDone()) {
            retentionTask.cancel(false);
            retentionTask = null;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Session session = (Session) o;
        return Objects.equals(sessionId, session.sessionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionId);
    }

    @Override
    public String toString() {
        return "Session{" +
                "sessionId='" + sessionId + '\'' +
                ", clientType=" + clientType +
                ", state=" + state +
                ", pairedSessionId='" + pairedSessionId + '\'' +
                ", active=" + isActive() +
                '}';
    }
}
