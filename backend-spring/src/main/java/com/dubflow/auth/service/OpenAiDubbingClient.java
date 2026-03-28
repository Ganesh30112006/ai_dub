package com.dubflow.auth.service;

import com.dubflow.auth.exception.AuthException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class OpenAiDubbingClient {

    private static final MediaType JSON = MediaType.parse("application/json");

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .callTimeout(Duration.ofMinutes(10))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${dubflow.ai.openai.api-key:}")
    private String apiKey;

    @Value("${dubflow.ai.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${dubflow.ai.openai.transcription-model:whisper-1}")
    private String transcriptionModel;

    @Value("${dubflow.ai.openai.translation-model:gpt-4o-mini}")
    private String translationModel;

    @Value("${dubflow.ai.openai.tts-model:gpt-4o-mini-tts}")
    private String ttsModel;

    public OpenAiDubbingClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void assertConfigured() {
        if (!StringUtils.hasText(apiKey)) {
            throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE, "OPENAI_API_KEY is missing. Configure it to enable real AI dubbing.");
        }
    }

    public TranscriptionResult transcribe(Path audioPath, String sourceLanguage) {
        assertConfigured();

        try {
            MultipartBody.Builder multipart = new MultipartBody.Builder().setType(MultipartBody.FORM)
                    .addFormDataPart("model", transcriptionModel)
                    .addFormDataPart("response_format", "verbose_json")
                    .addFormDataPart(
                            "file",
                            audioPath.getFileName().toString(),
                            RequestBody.create(audioPath.toFile(), MediaType.parse(detectMediaType(audioPath)))
                    );

            if (StringUtils.hasText(sourceLanguage)) {
                multipart.addFormDataPart("language", sourceLanguage.toLowerCase(Locale.ROOT));
            }

            Request request = baseRequest(baseUrl + "/audio/transcriptions")
                    .post(multipart.build())
                    .build();

            JsonNode root = executeJson(request);
            String text = root.path("text").asText("").trim();

            List<TranscriptionSegment> segments = new ArrayList<>();
            JsonNode segmentNodes = root.path("segments");
            if (segmentNodes.isArray()) {
                for (int i = 0; i < segmentNodes.size(); i++) {
                    JsonNode node = segmentNodes.get(i);
                    int start = (int) Math.floor(node.path("start").asDouble(0));
                    int end = (int) Math.ceil(node.path("end").asDouble(start + 1));
                    String segmentText = node.path("text").asText("").trim();
                    if (!StringUtils.hasText(segmentText)) {
                        continue;
                    }
                    String speaker = i % 2 == 0 ? "Speaker A" : "Speaker B";
                    segments.add(new TranscriptionSegment(speaker, Math.max(0, start), Math.max(start + 1, end), segmentText));
                }
            }

            if (segments.isEmpty() && StringUtils.hasText(text)) {
                segments.add(new TranscriptionSegment("Speaker A", 0, Math.max(4, text.length() / 16), text));
            }

            return new TranscriptionResult(text, segments);
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Unable to transcribe media with OpenAI");
        }
    }

    public List<String> translateSegments(List<String> sourceTexts, String targetLanguage) {
        assertConfigured();

        if (sourceTexts.isEmpty()) {
            return List.of();
        }

        try {
            String payload = objectMapper.writeValueAsString(sourceTexts);
            String prompt = "Translate each input string into " + targetLanguage + ". Return ONLY a JSON array of translated strings in the same order.";

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", translationModel);
            requestBody.set("messages", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode().put("role", "system").put("content", prompt))
                .add(objectMapper.createObjectNode().put("role", "user").put("content", payload))
            );
            requestBody.put("temperature", 0.2);

            String body = objectMapper.writeValueAsString(requestBody);

            Request request = baseRequest(baseUrl + "/chat/completions")
                    .post(RequestBody.create(body, JSON))
                    .build();

            JsonNode root = executeJson(request);
            String content = root.path("choices").path(0).path("message").path("content").asText("").trim();

            List<String> translated = parseStringArray(content);
            if (translated.size() != sourceTexts.size()) {
                return sourceTexts;
            }
            return translated;
        } catch (IOException ex) {
            return sourceTexts;
        }
    }

    public Path synthesizeSpeech(String translatedScript, String voiceModel, Path outputPath) {
        assertConfigured();

        try {
            String voice = mapVoice(voiceModel);
            String body = objectMapper.writeValueAsString(
                    objectMapper.createObjectNode()
                            .put("model", ttsModel)
                            .put("voice", voice)
                            .put("input", translatedScript)
                            .put("format", "mp3")
            );

            Request request = baseRequest(baseUrl + "/audio/speech")
                    .post(RequestBody.create(body, JSON))
                    .build();

            byte[] audioBytes = executeBinary(request);
            Files.write(outputPath, audioBytes);
            return outputPath;
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Unable to synthesize speech with OpenAI");
        }
    }

    private Request.Builder baseRequest(String url) {
        return new Request.Builder()
                .url(url)
                .header("Authorization", "Bearer " + apiKey);
    }

    private JsonNode executeJson(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String message = response.body() == null ? "Unknown error" : response.body().string();
                throw new AuthException(HttpStatus.BAD_GATEWAY, "OpenAI request failed: " + message);
            }
            if (response.body() == null) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response body");
            }
            return objectMapper.readTree(response.body().string());
        }
    }

    private byte[] executeBinary(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String message = response.body() == null ? "Unknown error" : response.body().string();
                throw new AuthException(HttpStatus.BAD_GATEWAY, "OpenAI request failed: " + message);
            }
            if (response.body() == null) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response body");
            }
            return response.body().bytes();
        }
    }

    private String detectMediaType(Path path) throws IOException {
        String type = Files.probeContentType(path);
        return StringUtils.hasText(type) ? type : "application/octet-stream";
    }

    private List<String> parseStringArray(String value) {
        String normalized = value.trim();
        if (normalized.startsWith("```") && normalized.endsWith("```")) {
            normalized = normalized.replaceFirst("^```[a-zA-Z]*", "").replaceFirst("```$", "").trim();
        }

        try {
            return objectMapper.readValue(normalized, new TypeReference<>() {
            });
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String mapVoice(String voiceModel) {
        String normalized = (voiceModel == null ? "" : voiceModel).toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "clone" -> "nova";
            case "studio" -> "verse";
            default -> "alloy";
        };
    }

    public record TranscriptionResult(String fullText, List<TranscriptionSegment> segments) {
    }

    public record TranscriptionSegment(String speaker, int startSeconds, int endSeconds, String text) {
    }
}
