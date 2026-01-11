package com.chromeagent.message;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * JSON codec for Message serialization/deserialization.
 * Thread-safe singleton.
 */
public class MessageCodec {
    private static final Logger logger = LoggerFactory.getLogger(MessageCodec.class);
    private static final MessageCodec INSTANCE = new MessageCodec();

    private final ObjectMapper mapper;

    private MessageCodec() {
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
        this.mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
    }

    public static MessageCodec getInstance() {
        return INSTANCE;
    }

    /**
     * Encode a Message to JSON string.
     *
     * @param message Message to encode
     * @return JSON string
     */
    public String encode(Message message) {
        try {
            return mapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            logger.error("Failed to encode message: {}", message, e);
            throw new RuntimeException("Failed to encode message", e);
        }
    }

    /**
     * Decode a JSON string to Message.
     *
     * @param json JSON string to decode
     * @return Optional containing the decoded Message, or empty if decoding fails
     */
    public Optional<Message> decode(String json) {
        try {
            Message message = mapper.readValue(json, Message.class);
            return Optional.of(message);
        } catch (JsonProcessingException e) {
            logger.error("Failed to decode message: {}", json, e);
            return Optional.empty();
        }
    }

    /**
     * Get the underlying ObjectMapper for custom operations.
     *
     * @return ObjectMapper instance
     */
    public ObjectMapper getMapper() {
        return mapper;
    }
}
