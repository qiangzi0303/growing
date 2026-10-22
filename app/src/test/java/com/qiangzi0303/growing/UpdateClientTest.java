package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

public class UpdateClientTest {
    private static final String ENDPOINT = "https://updates.example.org/growing/update.json";
    private String release(int code) {
        return "{\"schemaVersion\":1,\"packageName\":\"com.qiangzi0303.growing\",\"versionCode\":" + code
            + ",\"versionName\":\"1.0." + code + "\",\"apkUrl\":\"growing-1.0." + code
            + ".apk\",\"notes\":\"修复答疑\\n支持站点更新\"}";
    }
    private UpdateRelease parse(String json) throws IOException { return UpdateRelease.parse(json, ENDPOINT); }
    private UpdateClient client(FakeConnection connection) { return new UpdateClient(ENDPOINT, url -> connection); }

    @Test public void comparesNumericAndroidCodesAcrossDoubleDigits() throws Exception {
        UpdateRelease info = parse(release(10));
        assertTrue(info.isNewerThan(9));
        assertFalse(info.isNewerThan(10));
        assertFalse(info.isNewerThan(11));
        assertEquals("1.0.10", info.versionName);
        assertEquals("https://updates.example.org/growing/growing-1.0.10.apk", info.downloadUrl);
        assertEquals("修复答疑\n支持站点更新", info.notes);
    }

    @Test public void acceptsAbsoluteAndRootRelativeUrlsOnSameSite() throws Exception {
        assertEquals("https://updates.example.org/files/new.apk", parse(release(10).replace("growing-1.0.10.apk", "/files/new.apk")).downloadUrl);
        assertEquals("https://updates.example.org:443/files/new.apk", parse(release(10).replace("growing-1.0.10.apk", "https://updates.example.org:443/files/new.apk")).downloadUrl);
    }

    @Test public void refusesForeignInsecureOrCredentialedDownloadLocations() {
        for (String url : new String[]{"https://other.example.org/a.apk", "http://updates.example.org/a.apk",
                "//other.example.org/a.apk", "https://user:pass@updates.example.org/a.apk", "javascript:alert(1)",
                "https://updates.example.org:8443/a.apk", "a.apk#fragment", "file:///data/a.apk"}) {
            assertThrows(IOException.class, () -> parse(release(10).replace("growing-1.0.10.apk", url)));
        }
    }

    @Test public void rejectsMissingApkWrongPackageAndUnsupportedSchema() {
        assertThrows(IOException.class, () -> parse(release(10).replace("growing-1.0.10.apk", "")));
        assertThrows(IOException.class, () -> parse(release(10).replace(".apk", ".html")));
        assertThrows(IOException.class, () -> parse(release(10).replace("com.qiangzi0303.growing", "com.other.app")));
        assertThrows(IOException.class, () -> parse(release(10).replace("\"schemaVersion\":1", "\"schemaVersion\":2")));
        assertThrows(IOException.class, () -> parse(release(10).replace("\"schemaVersion\":1", "\"schemaVersion\":1.5")));
    }

    @Test public void rejectsMalformedVersionsAndMetadata() {
        for (String json : new String[]{"", "{}", "[]", release(0), release(-1),
                release(10).replace("\"versionCode\":10", "\"versionCode\":9999999999"),
                release(10).replace("\"versionCode\":10", "\"versionCode\":10.5"),
                release(10).replace("\"versionCode\":10", "\"versionCode\":\"10\"")}) {
            assertThrows(IOException.class, () -> parse(json));
        }
    }

    @Test public void rejectsInvalidManifestAddressBeforeRequest() {
        for (String url : new String[]{"", "http://updates.example.org/update.json", "https://user:pass@updates.example.org/update.json",
                "https://updates.example.org/update.json#x", "https:///update.json"}) {
            assertThrows(IOException.class, () -> new UpdateClient(url, ignored -> { fail("Must not request an invalid URL"); return null; }).check("", ""));
        }
    }

    @Test public void fetchesPublicMetadataWithTimeoutAndCachesEtag() throws Exception {
        FakeConnection connection = new FakeConnection(200, release(10));
        UpdateClient.Result result = new UpdateClient(ENDPOINT, url -> {
            assertEquals(ENDPOINT, url.toString()); return connection;
        }).check("", "");
        assertTrue(result.release.isNewerThan(6));
        assertEquals("test-etag", result.etag);
        assertEquals(release(10), result.json);
        assertEquals(8000, connection.getConnectTimeout());
        assertEquals(8000, connection.getReadTimeout());
        assertFalse(connection.getInstanceFollowRedirects());
        assertFalse(connection.getUseCaches());
        assertEquals("application/json", connection.getRequestProperty("Accept"));
        assertEquals("no-cache", connection.getRequestProperty("Cache-Control"));
        assertNull(connection.getRequestProperty("Authorization"));
        assertTrue(connection.disconnected);
    }

    @Test public void notModifiedReusesPreviouslyValidatedMetadata() throws Exception {
        FakeConnection connection = new FakeConnection(304, "");
        UpdateClient.Result result = client(connection).check(release(10), "cached-etag");
        assertEquals("cached-etag", connection.getRequestProperty("If-None-Match"));
        assertEquals(10, result.release.versionCode);
        assertTrue(connection.disconnected);
    }

    @Test public void missingManifestIsDeploymentErrorInsteadOfUpToDate() throws Exception {
        FakeConnection connection = new FakeConnection(404, "");
        IOException error = assertThrows(IOException.class, () -> client(connection).check("", ""));
        assertTrue(error.getMessage().contains("update.json"));
        assertTrue(connection.disconnected);
    }

    @Test public void failsOnRateLimitServerErrorRedirectOrInvalidCache() throws Exception {
        for (int status : new int[]{403, 429, 500, 302, 304}) {
            FakeConnection connection = new FakeConnection(status, "");
            assertThrows(IOException.class, () -> client(connection).check("", ""));
            assertTrue(connection.disconnected);
        }
    }

    @Test public void rejectsOversizedResponseAndAlwaysDisconnects() throws Exception {
        FakeConnection connection = new FakeConnection(200, "x".repeat(262145));
        assertThrows(IOException.class, () -> client(connection).check("", ""));
        assertTrue(connection.disconnected);
    }

    @Test public void offlineFailurePropagatesWithoutUsingStaleUpdate() throws Exception {
        UpdateClient client = new UpdateClient(ENDPOINT, url -> { throw new IOException("offline"); });
        assertThrows(IOException.class, () -> client.check(release(10), "cached-etag"));
    }

    private static final class FakeConnection extends HttpURLConnection {
        private final int status;
        private final byte[] body;
        boolean disconnected;
        FakeConnection(int status, String body) throws IOException {
            super(new URL(ENDPOINT));
            this.status = status; this.body = body.getBytes(StandardCharsets.UTF_8);
        }
        @Override public int getResponseCode() { return status; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(body); }
        @Override public String getHeaderField(String name) { return "ETag".equals(name) ? "test-etag" : null; }
        @Override public void disconnect() { disconnected = true; }
        @Override public boolean usingProxy() { return false; }
        @Override public void connect() {}
    }
}
