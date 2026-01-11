package com.chromeagent.session;

/**
 * Session lifecycle states.
 */
public enum SessionState {
    /**
     * Session is being established.
     */
    CONNECTING,

    /**
     * Session is connected but not yet paired with a counterpart.
     */
    CONNECTED,

    /**
     * Session is paired with another session (agent-extension pair).
     */
    PAIRED,

    /**
     * Session is temporarily disconnected (within retention period).
     */
    DISCONNECTED,

    /**
     * Session has been terminated.
     */
    TERMINATED
}
