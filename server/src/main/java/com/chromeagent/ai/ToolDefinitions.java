package com.chromeagent.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Tool definitions for Claude API Tool Calling.
 * Based on PRD Section 4.2 command types.
 */
public class ToolDefinitions {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static ArrayNode toolsCache;

    private ToolDefinitions() {
        // Utility class
    }

    /**
     * Get the tools array for Claude API.
     */
    public static synchronized ArrayNode getTools() {
        if (toolsCache == null) {
            toolsCache = buildTools();
        }
        return toolsCache;
    }

    private static ArrayNode buildTools() {
        ArrayNode tools = mapper.createArrayNode();

        // EXTRACT_COOKIES
        tools.add(buildTool(
                "extract_cookies",
                "Extract cookies from the current web page. Use this when the user wants to get cookie information.",
                buildCookiesSchema()
        ));

        // EXTRACT_DOM
        tools.add(buildTool(
                "extract_dom",
                "Extract DOM elements from the web page using CSS selectors. Use this when the user wants to get HTML content, text, or attributes from specific elements.",
                buildDomSchema()
        ));

        // EXTRACT_FORM
        tools.add(buildTool(
                "extract_form",
                "Extract form information including all form fields. Use this when the user wants to get login form, search form, or any other form information.",
                buildFormSchema()
        ));

        // GET_PAGE_INFO
        tools.add(buildTool(
                "get_page_info",
                "Get basic information about the current page including URL, title, and domain.",
                buildPageInfoSchema()
        ));

        return tools;
    }

    private static ObjectNode buildTool(String name, String description, ObjectNode inputSchema) {
        ObjectNode tool = mapper.createObjectNode();
        tool.put("name", name);
        tool.put("description", description);
        tool.set("input_schema", inputSchema);
        return tool;
    }

    private static ObjectNode buildCookiesSchema() {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");

        ObjectNode properties = mapper.createObjectNode();

        ObjectNode domain = mapper.createObjectNode();
        domain.put("type", "string");
        domain.put("description", "Domain to filter cookies. Leave empty for current domain.");
        properties.set("domain", domain);

        ObjectNode names = mapper.createObjectNode();
        names.put("type", "array");
        names.set("items", mapper.createObjectNode().put("type", "string"));
        names.put("description", "Specific cookie names to extract. Leave empty for all cookies.");
        properties.set("names", names);

        schema.set("properties", properties);
        schema.set("required", mapper.createArrayNode());

        return schema;
    }

    private static ObjectNode buildDomSchema() {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");

        ObjectNode properties = mapper.createObjectNode();

        ObjectNode selector = mapper.createObjectNode();
        selector.put("type", "string");
        selector.put("description", "CSS selector to find elements");
        properties.set("selector", selector);

        ObjectNode extractType = mapper.createObjectNode();
        extractType.put("type", "string");
        ArrayNode enumValues = mapper.createArrayNode();
        enumValues.add("html").add("text").add("attribute").add("all");
        extractType.set("enum", enumValues);
        extractType.put("description", "Type of data to extract: html (outer HTML), text (inner text), attribute (specific attributes), all (everything)");
        properties.set("extractType", extractType);

        ObjectNode attributes = mapper.createObjectNode();
        attributes.put("type", "array");
        attributes.set("items", mapper.createObjectNode().put("type", "string"));
        attributes.put("description", "Attribute names to extract (only used when extractType is 'attribute')");
        properties.set("attributes", attributes);

        ObjectNode multiple = mapper.createObjectNode();
        multiple.put("type", "boolean");
        multiple.put("description", "Whether to extract multiple matching elements (true) or just the first one (false)");
        properties.set("multiple", multiple);

        schema.set("properties", properties);

        ArrayNode required = mapper.createArrayNode();
        required.add("selector");
        required.add("extractType");
        schema.set("required", required);

        return schema;
    }

    private static ObjectNode buildFormSchema() {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");

        ObjectNode properties = mapper.createObjectNode();

        ObjectNode formSelector = mapper.createObjectNode();
        formSelector.put("type", "string");
        formSelector.put("description", "CSS selector to find the form element");
        properties.set("formSelector", formSelector);

        ObjectNode includeHidden = mapper.createObjectNode();
        includeHidden.put("type", "boolean");
        includeHidden.put("description", "Whether to include hidden form fields");
        properties.set("includeHidden", includeHidden);

        schema.set("properties", properties);

        ArrayNode required = mapper.createArrayNode();
        required.add("formSelector");
        schema.set("required", required);

        return schema;
    }

    private static ObjectNode buildPageInfoSchema() {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        schema.set("properties", mapper.createObjectNode());
        schema.set("required", mapper.createArrayNode());
        return schema;
    }

    /**
     * Convert tool name to command name.
     */
    public static String toolToCommand(String toolName) {
        if (toolName == null) {
            return null;
        }
        return switch (toolName) {
            case "extract_cookies" -> "EXTRACT_COOKIES";
            case "extract_dom" -> "EXTRACT_DOM";
            case "extract_form" -> "EXTRACT_FORM";
            case "get_page_info" -> "GET_PAGE_INFO";
            default -> toolName.toUpperCase();
        };
    }
}
