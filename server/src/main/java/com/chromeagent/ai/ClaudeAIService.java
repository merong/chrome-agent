package com.chromeagent.ai;

import com.chromeagent.config.ServerConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Claude API service implementation.
 * Uses Tool Calling to convert natural language to structured commands.
 */
public class ClaudeAIService implements AIService {
    private static final Logger logger = LoggerFactory.getLogger(ClaudeAIService.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String API_VERSION = "2023-06-01";
    private static final MediaType JSON = MediaType.get("application/json");

    private final OkHttpClient client;
    private final ObjectMapper mapper;
    private final String apiKey;
    private final String model;

    public ClaudeAIService(ServerConfig config) {
        this.apiKey = config.getClaudeApiKey();
        this.model = config.getClaudeModel();
        this.mapper = new ObjectMapper();

        // Validate API key
        if (this.apiKey == null || this.apiKey.isBlank()) {
            throw new IllegalStateException(
                    "CLAUDE_API_KEY environment variable is required. " +
                    "Please set it before starting the server."
            );
        }

        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();

        logger.info("ClaudeAIService initialized with model: {}", model);
    }

    @Override
    public ObjectNode processNaturalLanguage(String prompt) {
        logger.info("Processing natural language prompt: {}", prompt);

        try {
            ObjectNode requestBody = buildRequestBody(prompt);
            Request request = new Request.Builder()
                    .url(API_URL)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("x-api-key", apiKey)
                    .addHeader("anthropic-version", API_VERSION)
                    .post(RequestBody.create(mapper.writeValueAsBytes(requestBody), JSON))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "No response body";
                    logger.error("Claude API error: {} - {}", response.code(), errorBody);
                    return createError("API request failed: " + response.code());
                }

                ResponseBody body = response.body();
                if (body == null) {
                    return createError("Empty response from Claude API");
                }

                String responseBody = body.string();
                logger.debug("Claude API response: {}", responseBody);

                return parseResponse(responseBody);
            }
        } catch (IOException e) {
            logger.error("Error calling Claude API", e);
            return createError("Failed to call Claude API: " + e.getMessage());
        }
    }

    private ObjectNode buildRequestBody(String prompt) {
        ObjectNode root = mapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", 1024);

        // System prompt
        root.put("system", buildSystemPrompt());

        // Messages
        ArrayNode messages = mapper.createArrayNode();
        ObjectNode userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        root.set("messages", messages);

        // Tools
        root.set("tools", ToolDefinitions.getTools());

        // Force tool use
        ObjectNode toolChoice = mapper.createObjectNode();
        toolChoice.put("type", "any");
        root.set("tool_choice", toolChoice);

        return root;
    }

    private String buildSystemPrompt() {
        return """
            You are a browser automation assistant that converts natural language commands into specific tool calls.

            Available tools:
            - extract_cookies: Get cookies from the current page
            - extract_dom: Extract HTML elements using CSS selectors
            - extract_form: Get form field information
            - get_page_info: Get current page URL, title, and domain

            When the user asks to:
            - Get cookies, session info, auth tokens → use extract_cookies
            - Get page elements, products, lists, text content → use extract_dom with appropriate selector
            - Get form info, login form, search box → use extract_form
            - Get current URL, page title → use get_page_info

            Always try to infer the most appropriate CSS selector based on common patterns:
            - Product lists: ".product", ".item", "[data-product]"
            - Login forms: "form[action*='login']", "#login-form", ".login-form"
            - Search: "form[action*='search']", "#search-form"
            - Navigation: "nav", ".navbar", "#navigation"

            If you cannot determine a specific selector, use a broad one and set multiple=true.
            """;
    }

    private ObjectNode parseResponse(String responseBody) {
        try {
            JsonNode response = mapper.readTree(responseBody);
            JsonNode content = response.get("content");

            if (content == null || !content.isArray() || content.isEmpty()) {
                return createError("Invalid response format from Claude API");
            }

            // Find tool_use block
            for (JsonNode block : content) {
                if ("tool_use".equals(block.path("type").asText())) {
                    String toolName = block.path("name").asText();
                    JsonNode input = block.get("input");

                    ObjectNode result = mapper.createObjectNode();
                    result.put("command", ToolDefinitions.toolToCommand(toolName));
                    if (input != null) {
                        result.set("params", input);
                    } else {
                        result.set("params", mapper.createObjectNode());
                    }

                    logger.info("Parsed command: {} with params: {}",
                            result.get("command"), result.get("params"));
                    return result;
                }
            }

            // No tool_use found - check for text response
            for (JsonNode block : content) {
                if ("text".equals(block.path("type").asText())) {
                    String text = block.path("text").asText();
                    logger.warn("Claude returned text instead of tool use: {}", text);
                    return createError("Unable to convert to command: " + text);
                }
            }

            return createError("No tool use in Claude response");

        } catch (Exception e) {
            logger.error("Error parsing Claude response", e);
            return createError("Failed to parse Claude response: " + e.getMessage());
        }
    }

    private ObjectNode createError(String message) {
        ObjectNode error = mapper.createObjectNode();
        error.put("error", message);
        return error;
    }
}
