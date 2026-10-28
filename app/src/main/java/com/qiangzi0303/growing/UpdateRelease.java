package com.qiangzi0303.growing;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import org.json.JSONException;
import org.json.JSONObject;

/** Small static JSON manifest hosted alongside the APK on the owner's HTTPS site. */
final class UpdateRelease {
    final int versionCode;
    final String versionName;
    final String downloadUrl;
    final String notes;

    private UpdateRelease(int code, String name, String url, String notes) {
        versionCode = code; versionName = name; downloadUrl = url; this.notes = notes;
    }

    boolean isNewerThan(int installedCode) { return versionCode > installedCode; }

    static URI manifestUri(String endpoint) throws IOException {
        try {
            URI uri = new URI(endpoint);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getFragment() != null)
                throw new IOException("更新站点必须使用有效的 HTTPS 地址。");
            return uri;
        } catch (URISyntaxException e) { throw new IOException("更新站点地址不正确。", e); }
    }

    private static int port(URI uri) { return uri.getPort() == -1 ? 443 : uri.getPort(); }

    static UpdateRelease parse(String json, String endpoint) throws IOException {
        try {
            URI site = manifestUri(endpoint);
            JSONObject release = new JSONObject(json);
            if (!Integer.valueOf(1).equals(release.get("schemaVersion"))) throw new IOException("暂不支持该更新信息格式。");
            if (!"com.qiangzi0303.growing".equals(release.getString("packageName")))
                throw new IOException("更新信息不是逆流应用的安装包。");
            Object value = release.get("versionCode");
            if (!(value instanceof Integer || value instanceof Long)) throw new IOException("版本编号必须是正整数。");
            long code = ((Number) value).longValue();
            if (code <= 0 || code > Integer.MAX_VALUE) throw new IOException("版本编号超出有效范围。");
            String name = release.getString("versionName").trim();
            if (name.isEmpty() || name.length() > 80 || name.matches("(?s).*\\p{Cntrl}.*"))
                throw new IOException("版本名称不正确。");
            String apk = release.getString("apkUrl");
            if (apk.isEmpty()) throw new IOException("安装包地址为空。");
            URI download = manifestUri(site.resolve(new URI(apk)).toString());
            if (!site.getHost().equalsIgnoreCase(download.getHost()) || port(site) != port(download)
                    || download.getPath() == null || !download.getPath().endsWith(".apk"))
                throw new IOException("安装包必须位于同一更新站点并以 .apk 结尾。");
            String notes = release.optString("notes", "").trim();
            if (notes.length() > 4000) notes = notes.substring(0, 4000);
            return new UpdateRelease((int) code, name, download.toASCIIString(), notes);
        } catch (JSONException | URISyntaxException | IllegalArgumentException e) {
            throw new IOException("更新信息格式不正确，请稍后重试。", e);
        }
    }
}
