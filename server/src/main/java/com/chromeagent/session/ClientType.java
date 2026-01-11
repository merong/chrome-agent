package com.chromeagent.session;

/**
 * Client types that can connect to the server.
 */
public enum ClientType {
    AGENT("agent"),
    EXTENSION("extension");

    private final String value;

    ClientType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ClientType fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (ClientType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}
