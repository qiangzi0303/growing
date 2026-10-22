package com.qiangzi0303.growing;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Public site metadata only; never sends account data, passwords or AI keys. */
final class UpdateClient {
    interface ConnectionFactory { HttpURLConnection open(URL url) throws IOException; }
    static final class Result {
        final UpdateRelease release;
        final String json, etag;
        Result(UpdateRelease release, String json, String etag) {
            this.release = release; this.json = json; this.etag = etag;
        }
    }
    private final ConnectionFactory connections;
    private final String endpoint;
    UpdateClient(String endpoint) { this(endpoint, url -> (HttpURLConnection) url.openConnection()); }
    UpdateClient(String endpoint, ConnectionFactory connections) { this.endpoint = endpoint; this.connections = connections; }

    Result check(String cachedJson, String cachedEtag) throws IOException {
        HttpURLConnection connection = connections.open(UpdateRelease.manifestUri(endpoint).toURL());
        try {
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("User-Agent", "Growing-Android-Update");
            if (!cachedJson.isEmpty() && !cachedEtag.isEmpty())
                connection.setRequestProperty("If-None-Match", cachedEtag);
            int status = connection.getResponseCode();
            if (status == HttpURLConnection.HTTP_NOT_MODIFIED && !cachedJson.isEmpty())
                return new Result(UpdateRelease.parse(cachedJson, endpoint), cachedJson, cachedEtag);
            if (status == HttpURLConnection.HTTP_NOT_FOUND) throw new IOException("站点上尚未找到 update.json，请检查部署地址。");
            if (status == 403 || status == 429) throw new IOException("更新服务暂时限制访问，请稍后重试。");
            if (status != HttpURLConnection.HTTP_OK) throw new IOException("更新服务暂不可用（HTTP " + status + "）。");
            String json;
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096]; int count;
                long deadline = System.nanoTime() + 15_000_000_000L;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 262144 || System.nanoTime() > deadline)
                        throw new IOException("更新信息过大或读取超时，请稍后重试。");
                    output.write(buffer, 0, count);
                }
                json = output.toString(StandardCharsets.UTF_8.name());
            }
            String etag = connection.getHeaderField("ETag");
            return new Result(UpdateRelease.parse(json, endpoint), json, etag == null ? "" : etag);
        } finally { connection.disconnect(); }
    }
}
