package com.chromeagent.session;

import com.chromeagent.config.ServerConfig;
import com.chromeagent.message.Message;
import com.chromeagent.message.MessageCodec;
import com.chromeagent.message.MessageFactory;
import io.netty.channel.Channel;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.Queue;
import java.util.concurrent.*;

/**
 * Thread-safe session manager with 1:1 agent-extension pairing.
 * Handles session lifecycle including creation, pairing, disconnection, and retention.
 */
public class SessionManager {
    private static final Logger logger = LoggerFactory.getLogger(SessionManager.class);

    private final ConcurrentHashMap<String, Session> sessionsById = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Session> sessionsByChannelId = new ConcurrentHashMap<>();

    // Pending sessions waiting for pairing (FIFO)
    private final Queue<Session> pendingAgents = new ConcurrentLinkedQueue<>();
    private final Queue<Session> pendingExtensions = new ConcurrentLinkedQueue<>();

    private final ScheduledExecutorService scheduler;
    private final ServerConfig config;
    private final MessageCodec codec;

    public SessionManager(ServerConfig config) {
        this.config = config;
        this.scheduler = Executors.newScheduledThreadPool(2);
        this.codec = MessageCodec.getInstance();
        logger.info("SessionManager initialized with retention={}s", config.getSessionRetentionSeconds());
    }

    /**
     * Create a new session for a connected channel.
     */
    public Session createSession(Channel channel, ClientType clientType) {
        Session session = new Session(channel, clientType);
        session.setState(SessionState.CONNECTED);

        sessionsById.put(session.getSessionId(), session);
        sessionsByChannelId.put(channel.id().asLongText(), session);

        logger.info("Session created: {} ({})", session.getSessionId(), clientType);

        // Add to pending queue for pairing
        if (clientType == ClientType.AGENT) {
            pendingAgents.offer(session);
        } else {
            pendingExtensions.offer(session);
        }

        // Try to pair immediately
        tryPair();

        return session;
    }

    /**
     * Get session by session ID.
     */
    public Optional<Session> getSessionById(String sessionId) {
        return Optional.ofNullable(sessionsById.get(sessionId));
    }

    /**
     * Get session by channel.
     */
    public Optional<Session> getSessionByChannel(Channel channel) {
        if (channel == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessionsByChannelId.get(channel.id().asLongText()));
    }

    /**
     * Get the paired session for a given session.
     */
    public Optional<Session> getPairedSession(Session session) {
        if (session == null || session.getPairedSessionId() == null) {
            return Optional.empty();
        }
        return getSessionById(session.getPairedSessionId());
    }

    /**
     * Get the paired session for a given session ID.
     */
    public Optional<Session> getPairedSession(String sessionId) {
        return getSessionById(sessionId).flatMap(this::getPairedSession);
    }

    /**
     * Try to pair pending agents with pending extensions (FIFO).
     */
    private synchronized void tryPair() {
        while (!pendingAgents.isEmpty() && !pendingExtensions.isEmpty()) {
            Session agent = pendingAgents.poll();
            Session extension = pendingExtensions.poll();

            if (agent == null || extension == null) {
                break;
            }

            // Verify both are still active
            if (!agent.isActive()) {
                logger.debug("Skipping inactive agent: {}", agent.getSessionId());
                continue;
            }
            if (!extension.isActive()) {
                logger.debug("Skipping inactive extension: {}", extension.getSessionId());
                // Put agent back if extension was bad
                pendingAgents.offer(agent);
                continue;
            }

            // Pair them
            pairSessions(agent, extension);
        }
    }

    /**
     * Pair two sessions together.
     */
    private void pairSessions(Session agent, Session extension) {
        agent.setPairedSessionId(extension.getSessionId());
        agent.setState(SessionState.PAIRED);

        extension.setPairedSessionId(agent.getSessionId());
        extension.setState(SessionState.PAIRED);

        logger.info("Sessions paired: Agent {} <-> Extension {}",
                agent.getSessionId(), extension.getSessionId());

        // Notify both clients
        notifyPairing(agent, extension);
        notifyPairing(extension, agent);
    }

    /**
     * Notify a session about its pairing.
     */
    private void notifyPairing(Session session, Session pairedWith) {
        if (session.getChannel() != null && session.getChannel().isActive()) {
            Message statusMsg = MessageFactory.createPairingComplete(pairedWith.getSessionId());
            statusMsg.setSessionId(session.getSessionId());
            session.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(statusMsg)));
        }
    }

    /**
     * Handle a channel disconnect. Starts the retention period.
     */
    public void handleDisconnect(Channel channel) {
        Session session = sessionsByChannelId.remove(channel.id().asLongText());
        if (session == null) {
            return;
        }

        logger.info("Session disconnected: {} (starting {}s retention)",
                session.getSessionId(), config.getSessionRetentionSeconds());

        session.setChannel(null);
        session.setState(SessionState.DISCONNECTED);

        // Remove from pending queues if present
        pendingAgents.remove(session);
        pendingExtensions.remove(session);

        // Notify paired session
        getPairedSession(session).ifPresent(paired -> {
            if (paired.isActive()) {
                Message statusMsg = MessageFactory.createStatus("peer_disconnected",
                        "Paired session temporarily disconnected");
                statusMsg.setSessionId(paired.getSessionId());
                paired.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(statusMsg)));
            }
        });

        // Schedule removal after retention period
        ScheduledFuture<?> retentionTask = scheduler.schedule(() -> {
            if (session.getState() == SessionState.DISCONNECTED) {
                removeSession(session);
            }
        }, config.getSessionRetentionSeconds(), TimeUnit.SECONDS);

        session.setRetentionTask(retentionTask);
    }

    /**
     * Handle session reconnection.
     */
    public boolean handleReconnect(Channel channel, String sessionId) {
        Session session = sessionsById.get(sessionId);
        if (session == null) {
            logger.warn("Reconnect failed - session not found: {}", sessionId);
            return false;
        }

        if (session.getState() != SessionState.DISCONNECTED) {
            logger.warn("Reconnect failed - session not in disconnected state: {} ({})",
                    sessionId, session.getState());
            return false;
        }

        // Cancel retention timer
        session.cancelRetentionTask();

        // Restore session
        session.setChannel(channel);
        session.setState(session.getPairedSessionId() != null ? SessionState.PAIRED : SessionState.CONNECTED);
        sessionsByChannelId.put(channel.id().asLongText(), session);

        logger.info("Session reconnected: {}", sessionId);

        // Notify paired session
        getPairedSession(session).ifPresent(paired -> {
            if (paired.isActive()) {
                Message statusMsg = MessageFactory.createStatus("peer_reconnected",
                        "Paired session reconnected");
                statusMsg.setSessionId(paired.getSessionId());
                paired.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(statusMsg)));
            }
        });

        return true;
    }

    /**
     * Remove a session completely (after retention expires or on shutdown).
     */
    private void removeSession(Session session) {
        sessionsById.remove(session.getSessionId());

        if (session.getChannel() != null) {
            sessionsByChannelId.remove(session.getChannel().id().asLongText());
        }

        // Unpair if paired
        if (session.getPairedSessionId() != null) {
            Session paired = sessionsById.get(session.getPairedSessionId());
            if (paired != null) {
                paired.setPairedSessionId(null);
                paired.setState(SessionState.CONNECTED);

                // Add back to pending queue for re-pairing
                if (paired.isActive()) {
                    if (paired.getClientType() == ClientType.AGENT) {
                        pendingAgents.offer(paired);
                    } else {
                        pendingExtensions.offer(paired);
                    }
                    // Try to pair with any waiting session
                    tryPair();
                }

                // Notify about unpair
                if (paired.isActive()) {
                    Message statusMsg = MessageFactory.createStatus("unpaired",
                            "Paired session expired");
                    statusMsg.setSessionId(paired.getSessionId());
                    paired.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(statusMsg)));
                }
            }
        }

        session.setState(SessionState.TERMINATED);
        logger.info("Session removed: {}", session.getSessionId());
    }

    /**
     * Update session activity timestamp.
     */
    public void updateActivity(Channel channel) {
        getSessionByChannel(channel).ifPresent(Session::updateActivity);
    }

    /**
     * Get count of active sessions by type.
     */
    public int getActiveSessionCount(ClientType type) {
        return (int) sessionsById.values().stream()
                .filter(s -> s.getClientType() == type && s.isActive())
                .count();
    }

    /**
     * Notify all sessions about server shutdown.
     */
    public void notifyShutdown() {
        Message shutdownMsg = MessageFactory.createStatus("server_shutdown",
                "Server is shutting down");

        sessionsById.values().forEach(session -> {
            if (session.isActive()) {
                shutdownMsg.setSessionId(session.getSessionId());
                session.getChannel().writeAndFlush(new TextWebSocketFrame(codec.encode(shutdownMsg)));
            }
        });
    }

    /**
     * Close all sessions.
     */
    public void closeAllSessions() {
        sessionsById.values().forEach(session -> {
            session.cancelRetentionTask();
            if (session.getChannel() != null && session.getChannel().isActive()) {
                session.getChannel().close();
            }
        });

        sessionsById.clear();
        sessionsByChannelId.clear();
        pendingAgents.clear();
        pendingExtensions.clear();
    }

    /**
     * Shutdown the session manager.
     */
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
