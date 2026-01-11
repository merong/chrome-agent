package com.chromeagent.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Interface for AI service operations.
 */
public interface AIService {
    /**
     * Process a natural language prompt and convert it to a command.
     *
     * @param prompt Natural language input from the user
     * @return ObjectNode containing either:
     *         - On success: {"command": "...", "params": {...}}
     *         - On error: {"error": "error message"}
     */
    ObjectNode processNaturalLanguage(String prompt);
}
