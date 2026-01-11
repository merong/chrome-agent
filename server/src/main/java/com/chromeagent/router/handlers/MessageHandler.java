package com.chromeagent.router.handlers;

import com.chromeagent.message.Message;
import com.chromeagent.session.Session;

/**
 * Interface for message type handlers.
 */
public interface MessageHandler {
    /**
     * Handle a message from a session.
     *
     * @param session The session that sent the message
     * @param message The message to handle
     */
    void handle(Session session, Message message);
}
