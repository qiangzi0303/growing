package com.qiangzi0303.growing;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import org.json.JSONObject;

/** Storage is bound to a login session; JavaScript cannot select another student's data. */
public final class LearningBridge {
    private final MainActivity activity;
    private final String accountId;
    private final long session;
    private final SharedPreferences learning, settings;
    public LearningBridge(MainActivity activity, String accountId, long session) {
        this.activity=activity; this.accountId=accountId; this.session=session;
        learning=activity.getSharedPreferences("learning-v1-"+accountId,Context.MODE_PRIVATE);
        settings=activity.getSharedPreferences("settings-v1-"+accountId,Context.MODE_PRIVATE);
    }
    private void authorize() { if (!activity.isSession(accountId,session)) throw new SecurityException("登录已失效，请重新进入学习。"); }
    private String error(Exception e) { return "{\"ok\":false,\"error\":\"学习记录未保存，请重新登录或检查手机存储。\"}"; }
    @JavascriptInterface public String get(String key) {
        try { authorize(); return new JSONObject().put("ok",true).put("value",learning.contains(key)?learning.getString(key,""):JSONObject.NULL).toString(); }
        catch(Exception e) { return error(e); }
    }
    @JavascriptInterface public String put(String key,String value) {
        try { authorize(); if(key.length()>200 || value.length()>10_000_000)throw new IllegalArgumentException();
            if(!learning.edit().putString(key,value).commit())throw new IllegalStateException(); return "{\"ok\":true}"; }
        catch(Exception e) { return error(e); }
    }
    @JavascriptInterface public String remove(String key) {
        try { authorize(); if(!learning.edit().remove(key).commit())throw new IllegalStateException(); return "{\"ok\":true}"; }
        catch(Exception e) { return error(e); }
    }
    @JavascriptInterface public String clear() {
        try { authorize(); if(!learning.edit().clear().commit())throw new IllegalStateException(); return "{\"ok\":true}"; }
        catch(Exception e) { return error(e); }
    }
    @JavascriptInterface public String keys() {
        try { authorize(); return new JSONObject().put("ok",true).put("value",new JSONArray(learning.getAll().keySet())).toString(); }
        catch(Exception e) { return error(e); }
    }
    /** Compatibility only: model credentials now come from the authenticated cloud configuration. */
    @JavascriptInterface public String aiKey() { return ""; }
    @JavascriptInterface public String saveAiKey(String value) {
        return "{\"ok\":false,\"error\":\"AI 模型由管理后台统一配置，无需设置个人密钥。\"}";
    }
    @JavascriptInterface public String realtimeSettings() {
        try{authorize();return new JSONObject().put("ok",true).put("value",new JSONObject().put("voice",settings.getString("realtime.voice","Tina"))).toString();}
        catch(Exception e){return error(e);}
    }
    @JavascriptInterface public String saveRealtimeSettings(String json) {
        return "{\"ok\":false,\"error\":\"语音模型由管理后台统一配置。\"}";
    }
    @JavascriptInterface public String cloudApiUrl() { try{authorize();return BuildConfig.CLOUD_API_URL;}catch(Exception e){return "";} }
    @JavascriptInterface public String takeRegistration() { try{authorize();return activity.takeRegistration(accountId,session);}catch(Exception e){return "";} }
    @JavascriptInterface public String identityAccount() { try{authorize();return activity.identityAccount(accountId,session);}catch(Exception e){return "";} }
    @JavascriptInterface public String confirmCloudSession(String value) {
        try{authorize();return new JSONObject().put("ok",true).put("reload",activity.confirmCloudSession(accountId,session,value)).toString();}
        catch(Exception e){return identityError(e);}
    }
    private String identityError(Exception e) {
        try{return new JSONObject().put("ok",false).put("error",e instanceof SecurityException||e instanceof IllegalStateException||e instanceof IllegalArgumentException?e.getMessage():"登录状态未保存，请重试。").toString();}
        catch(Exception ignored){return "{\"ok\":false,\"error\":\"登录状态未保存，请重试。\"}";}
    }
    @JavascriptInterface public String confirmIdentity(String profile) {
        try{authorize();activity.confirmIdentity(accountId,session,profile);return "{\"ok\":true}";}
        catch(Exception e){return identityError(e);}
    }
    @JavascriptInterface public void configureAi() { try{authorize();activity.runOnUiThread(()->{if(activity.isSession(accountId,session))activity.openAiSettings();});}catch(Exception ignored){} }
    @JavascriptInterface public void configureDevice() { try{authorize();activity.runOnUiThread(()->{if(activity.isSession(accountId,session))activity.showDeviceSettings();});}catch(Exception ignored){} }
    @JavascriptInterface public void logout() { try{authorize();activity.runOnUiThread(()->{if(activity.isSession(accountId,session))activity.logoutAccount();});}catch(Exception ignored){} }
    @JavascriptInterface public void home() { try{authorize();activity.runOnUiThread(activity::loadHome);}catch(Exception ignored){} }
    @JavascriptInterface public String openLearning() {
        try{authorize();activity.openLearning(accountId,session);return "{\"ok\":true}";}
        catch(Exception e){return "{\"ok\":false,\"error\":\"请先登录并确认学生身份。\"}";}
    }
}
