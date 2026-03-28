package com.dubflow.auth.service;

import com.dubflow.auth.exception.AuthException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.HttpUrl;
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

@Component
public class SoftcatalaDubbingClient {

    private static final MediaType JSON = MediaType.parse("application/json");

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .callTimeout(Duration.ofMinutes(10))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${dubflow.external.softcatala.base-url:https://api.softcatala.org/dubbing-service/v1}")
    private String baseUrl;

    public SoftcatalaDubbingClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Submission submitDubbingJob(
            Path videoPath,
            String email,
            String variant,
            String videoLang,
            boolean originalSubtitles,
            boolean dubbedSubtitles
    ) {
        if (!StringUtils.hasText(email)) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Authenticated email is required for Softcatala dubbing");
        }

        try {
            MultipartBody.Builder multipart = new MultipartBody.Builder().setType(MultipartBody.FORM)
                    .addFormDataPart("email", email)
                    .addFormDataPart("variant", StringUtils.hasText(variant) ? variant : "central")
                    .addFormDataPart("video_lang", StringUtils.hasText(videoLang) ? videoLang : "auto")
                    .addFormDataPart(
                            "file",
                            videoPath.getFileName().toString(),
                            RequestBody.create(videoPath.toFile(), MediaType.parse("video/mp4"))
                    );

            if (originalSubtitles) {
                multipart.addFormDataPart("original_subtitles", "on");
            }
            if (dubbedSubtitles) {
                multipart.addFormDataPart("dubbed_subtitles", "on");
            }

            Request request = new Request.Builder()
                    .url(joinPath("/dubbing_file/"))
                    .post(multipart.build())
                    .build();

            JsonNode root = executeJson(request);
            String uuid = root.path("uuid").asText("").trim();
            if (!StringUtils.hasText(uuid)) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala API did not return a job uuid");
            }

            int waitingQueue = parseInt(root.path("waiting_queue").asText("0"), 0);
            return new Submission(uuid, waitingQueue);
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Unable to submit job to Softcatala dubbing service");
        }
    }

    public boolean isJobReady(String uuid) {
        HttpUrl url = HttpUrl.parse(joinPath("/uuid_exists/"))
                .newBuilder()
                .addQueryParameter("uuid", uuid)
                .build();

        Request request = new Request.Builder().url(url).get().build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.code() == 200) {
                return true;
            }
            if (response.code() == 404) {
                return false;
            }

            String message = response.body() == null ? "Unknown error" : response.body().string();
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala status check failed: " + message);
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Unable to check Softcatala job status");
        }
    }

    public Path downloadDubbedVideo(String uuid, Path outputPath) {
        HttpUrl url = HttpUrl.parse(joinPath("/get_file/"))
                .newBuilder()
                .addQueryParameter("uuid", uuid)
                .addQueryParameter("ext", "dub")
                .build();

        Request request = new Request.Builder().url(url).get().build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String message = response.body() == null ? "Unknown error" : response.body().string();
                throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala export download failed: " + message);
            }
            if (response.body() == null) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala export download returned empty body");
            }

            Files.write(outputPath, response.body().bytes());
            return outputPath;
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "Unable to download Softcatala dubbed video");
        }
    }

    public List<UtteranceItem> getUtterances(String uuid) {
        HttpUrl url = HttpUrl.parse(joinPath("/get_utterances"))
                .newBuilder()
                .addQueryParameter("uuid", uuid)
                .build();

        Request request = new Request.Builder().url(url).get().build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                return List.of();
            }
            if (response.body() == null) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body().string());
            if (!root.isArray()) {
                return List.of();
            }

            List<UtteranceItem> items = new ArrayList<>();
            for (JsonNode item : root) {
                int id = item.path("id").asInt(0);
                int start = (int) Math.floor(item.path("start").asDouble(0));
                int end = (int) Math.ceil(item.path("end").asDouble(start + 1));
                String text = item.path("text").asText("").trim();
                String translated = item.path("translated_text").asText(text).trim();
                String speaker = item.path("speaker_id").asText("Speaker").trim();

                if (!StringUtils.hasText(translated)) {
                    continue;
                }

                items.add(new UtteranceItem(
                        id,
                        StringUtils.hasText(speaker) ? speaker : "Speaker",
                        Math.max(0, start),
                        Math.max(start + 1, end),
                        text,
                        translated
                ));
            }
            return items;
        } catch (IOException ex) {
            return List.of();
        }
    }

    private JsonNode executeJson(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String message = response.body() == null ? "Unknown error" : response.body().string();
                throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala request failed: " + message);
            }
            if (response.body() == null) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "Softcatala request returned empty body");
            }
            return objectMapper.readTree(response.body().string());
        }
    }

    private int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String joinPath(String path) {
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return normalizedBase + normalizedPath;
    }

    public record Submission(String uuid, int waitingQueue) {
    }

    public record UtteranceItem(int id, String speaker, int startSeconds, int endSeconds, String text, String translatedText) {
    }
}
