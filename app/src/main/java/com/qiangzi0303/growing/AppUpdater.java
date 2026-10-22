package com.qiangzi0303.growing;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.SystemClock;
import android.widget.Toast;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Checks on foreground entry, without blocking login or offline lessons. */
final class AppUpdater implements AutoCloseable {
    private final Activity activity;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final SharedPreferences cache;
    private boolean started, closed, checking, manualRequested, returningFromDownload;
    private long lastCheck = -30000;
    private Runnable deferred;
    private AlertDialog dialog;

    AppUpdater(Activity activity) {
        this.activity = activity;
        cache = activity.getSharedPreferences("app-updates-v1", Activity.MODE_PRIVATE);
    }

    void onStart() {
        started = true;
        // Returning from the download browser must not immediately repeat the same prompt.
        if (returningFromDownload) { returningFromDownload = false; return; }
        if (deferred != null) { Runnable result = deferred; deferred = null; result.run(); }
        else if (!checking && (dialog == null || !dialog.isShowing())
                && SystemClock.elapsedRealtime() - lastCheck >= 30000) check(false);
    }

    void onStop() { started = false; }

    void check(boolean manual) {
        if (closed) return;
        if (BuildConfig.DEBUG) {
            if (manual) message("开发版不参与正式版更新，请在正式安装版中检查。");
            return;
        }
        if (BuildConfig.UPDATE_MANIFEST_URL.isEmpty()) {
            if (manual) message("此安装包尚未配置更新站点。");
            return;
        }
        if (dialog != null && dialog.isShowing()) return;
        manualRequested |= manual;
        if (checking) { if (manual) message("正在检查更新…"); return; }
        checking = true;
        lastCheck = SystemClock.elapsedRealtime();
        if (manual) message("正在检查更新…");
        worker.execute(() -> {
            UpdateClient.Result result = null;
            String error = null;
            try {
                String endpoint = BuildConfig.UPDATE_MANIFEST_URL;
                boolean sameSite = endpoint.equals(cache.getString("endpoint", ""));
                result = new UpdateClient(endpoint).check(sameSite ? cache.getString("json", "") : "", sameSite ? cache.getString("etag", "") : "");
                cache.edit().putString("endpoint", endpoint).putString("json", result.json).putString("etag", result.etag).apply();
            } catch (IOException | RuntimeException e) {
                error = e instanceof IOException && e.getMessage() != null
                    ? e.getMessage() : "请检查网络连接，稍后重试。";
            }
            UpdateClient.Result found = result;
            String failure = error;
            activity.runOnUiThread(() -> {
                if (closed || activity.isFinishing() || activity.isDestroyed()) return;
                checking = false;
                boolean notify = manualRequested; manualRequested = false;
                Runnable display = () -> present(found, failure, notify);
                if (started) display.run(); else deferred = display;
            });
        });
    }

    private void present(UpdateClient.Result result, String error, boolean manual) {
        if (error != null) { if (manual) message("检查更新失败：" + error); return; }
        UpdateRelease release = result == null ? null : result.release;
        if (release == null || !release.isNewerThan(BuildConfig.VERSION_CODE)) {
            if (manual) message("当前已是最新版本（" + BuildConfig.VERSION_NAME + "）。");
            return;
        }
        dialog = new AlertDialog.Builder(activity)
            .setTitle("发现新版本 " + release.versionName)
            .setMessage("当前版本：" + BuildConfig.VERSION_NAME + (release.notes.isEmpty() ? "" : "\n\n更新内容：\n" + release.notes)
                + "\n\n将用浏览器从更新站点下载 APK，下载完成后打开安装包，按系统提示覆盖安装。\n\n请不要卸载旧版，以保留账号和学习记录。")
            .setPositiveButton("下载更新", (d, w) -> download(release))
            .setNegativeButton("稍后", null).create();
        dialog.setOnDismissListener(d -> dialog = null);
        dialog.show();
    }

    private void download(UpdateRelease release) {
        try {
            returningFromDownload = true;
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(release.downloadUrl))
                .addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException | SecurityException e) {
            returningFromDownload = false;
            message("无法打开下载链接，请安装或启用浏览器后重新检查更新。");
        }
    }

    private void message(String text) { Toast.makeText(activity, text, Toast.LENGTH_LONG).show(); }

    @Override public void close() {
        closed = true; deferred = null;
        if (dialog != null) dialog.dismiss();
        worker.shutdownNow();
    }
}
