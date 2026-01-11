package com.chromeagent.router;

import com.chromeagent.config.ServerConfig;
import com.chromeagent.error.ErrorCode;
import com.chromeagent.error.ErrorHandler;
import com.chromeagent.message.MessageType;
import io.netty.channel.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.*;

/**
 * Tracks pending requests for proper request-response correlation.
 * This is critical for routing responses back to the correct agent.
 */
public class RequestTracker {
    private static final Logger logger = LoggerFactory.getLogger(RequestTracker.class);

    private final ConcurrentHashMap<String, PendingRequest> pendingRequests = new ConcurrentHashMap<>();
    private final ScheduledExecutorService timeoutScheduler;
    private final ErrorHandler errorHandler;
    private final int timeoutSeconds;

    public RequestTracker(ServerConfig config) {
        this.timeoutScheduler = Executors.newScheduledThreadPool(1);
        this.errorHandler = ErrorHandler.getInstance();
        this.timeoutSeconds = config.getCommandTimeoutSeconds();
    }

    /**
     * Track a new outgoing request.
     *
     * @param requestId Unique request ID
     * @param sourceChannel The channel that originated the request
     * @param sessionId The session ID of the requester
     * @param originalType The original message type
     */
    public void trackRequest(String requestId, Channel sourceChannel, String sessionId, MessageType originalType) {
        PendingRequest pending = new PendingRequest(
                requestId,
                sourceChannel,
                sessionId,
                Instant.now(),
                originalType
        );

        // Schedule timeout
        ScheduledFuture<?> timeoutTask = timeoutScheduler.schedule(() -> {
            handleTimeout(requestId);
        }, timeoutSeconds, TimeUnit.SECONDS);

        pending.setTimeoutTask(timeoutTask);
        pendingRequests.put(requestId, pending);

        logger.debug("Tracking request: {} (timeout: {}s)", requestId, timeoutSeconds);
    }

    /**
     * Complete a request and return the original requester info.
     *
     * @param requestId The request ID from the response
     * @return The pending request info, or empty if not found
     */
    public Optional<PendingRequest> completeRequest(String requestId) {
        PendingRequest pending = pendingRequests.remove(requestId);
        if (pending == null) {
            logger.warn("No pending request found for requestId: {}", requestId);
            return Optional.empty();
        }

        // Cancel timeout
        pending.cancelTimeout();

        long durationMs = java.time.Duration.between(pending.getCreatedAt(), Instant.now()).toMillis();
        logger.debug("Request completed: {} (duration: {}ms)", requestId, durationMs);

        return Optional.of(pending);
    }

    /**
     * Handle request timeout.
     */
    private void handleTimeout(String requestId) {
        PendingRequest pending = pendingRequests.remove(requestId);
        if (pending == null) {
            return; // Already completed
        }

        logger.warn("Request timed out: {} (after {}s)", requestId, timeoutSeconds);

        // Send timeout error to original requester
        Channel sourceChannel = pending.getSourceChannel();
        if (sourceChannel != null && sourceChannel.isActive()) {
            errorHandler.sendError(
                    sourceChannel,
                    ErrorCode.TIMEOUT,
                    "Command execution timed out after " + timeoutSeconds + " seconds",
                    requestId
            );
        }
    }

    /**
     * Check if a request is still pending.
     */
    public boolean isPending(String requestId) {
        return pendingRequests.containsKey(requestId);
    }

    /**
     * Get the count of pending requests.
     */
    public int getPendingCount() {
        return pendingRequests.size();
    }

    /**
     * Cancel all pending requests (e.g., on shutdown).
     */
    public void cancelAll() {
        pendingRequests.values().forEach(pending -> {
            pending.cancelTimeout();
            Channel sourceChannel = pending.getSourceChannel();
            if (sourceChannel != null && sourceChannel.isActive()) {
                errorHandler.sendError(
                        sourceChannel,
                        ErrorCode.INTERNAL_ERROR,
                        "Server shutting down",
                        pending.getRequestId()
                );
            }
        });
        pendingRequests.clear();
    }

    /**
     * Shutdown the tracker.
     */
    public void shutdown() {
        cancelAll();
        timeoutScheduler.shutdown();
        try {
            if (!timeoutScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                timeoutScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            timeoutScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Represents a pending request awaiting response.
     */
    public static class PendingRequest {
        private final String requestId;
        private final Channel sourceChannel;
        private final String sessionId;
        private final Instant createdAt;
        private final MessageType originalType;
        private ScheduledFuture<?> timeoutTask;

        public PendingRequest(String requestId, Channel sourceChannel, String sessionId,
                              Instant createdAt, MessageType originalType) {
            this.requestId = requestId;
            this.sourceChannel = sourceChannel;
            this.sessionId = sessionId;
            this.createdAt = createdAt;
            this.originalType = originalType;
        }

        public String getRequestId() {
            return requestId;
        }

        public Channel getSourceChannel() {
            return sourceChannel;
        }

        public String getSessionId() {
            return sessionId;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public MessageType getOriginalType() {
            return originalType;
        }

        public void setTimeoutTask(ScheduledFuture<?> timeoutTask) {
            this.timeoutTask = timeoutTask;
        }

        public void cancelTimeout() {
            if (timeoutTask != null && !timeoutTask.isDone()) {
                timeoutTask.cancel(false);
            }
        }
    }
}
