package com.qiangzi0303.growing;

import android.content.SharedPreferences;
import java.net.URI;
import org.json.JSONObject;

/** Account-local connection settings. They are never part of learning-record sync. */
final class RealtimeSettings {
    static final String DEFAULT_BASE="https://dashscope.aliyuncs.com";
    static final String[] VOICES={"Tina","Cherry","Serena","Ethan","Chelsie"};
    static JSONObject validate(String json) throws Exception {
        JSONObject value=new JSONObject(json);
        String key=value.optString("apiKey","").trim(),voice=value.optString("voice","Tina").trim();
        URI uri=new URI(value.optString("base",DEFAULT_BASE).trim());
        if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getPort()!=-1||uri.getQuery()!=null||uri.getFragment()!=null||
                !uri.getHost().matches("(?:dashscope(?:-intl)?\\.aliyuncs\\.com|[a-z0-9-]+\\.(?:cn-beijing|ap-southeast-1)\\.maas\\.aliyuncs\\.com)"))
            throw new IllegalArgumentException("请填写百炼官方 HTTPS 接口或业务空间地址。");
        if((!key.isEmpty()&&(key.length()<8||key.length()>512||key.matches("(?s).*\\s.*")))||!voice.matches("[A-Za-z][A-Za-z0-9_-]{0,63}"))
            throw new IllegalArgumentException("Qwen 密钥或音色 ID 格式不正确。");
        return new JSONObject().put("apiKey",key).put("base","https://"+uri.getHost()).put("voice",voice);
    }
    static JSONObject read(SharedPreferences settings) throws Exception {
        return new JSONObject().put("apiKey",settings.getString("realtime.key",""))
            .put("base",settings.getString("realtime.base",DEFAULT_BASE)).put("voice",settings.getString("realtime.voice","Tina"))
            .put("saved",settings.contains("realtime.key")||settings.contains("realtime.voice")||settings.contains("realtime.base"));
    }
    static void save(SharedPreferences settings,String json) throws Exception {
        SharedPreferences.Editor edit=settings.edit();
        if("null".equals(json))edit.remove("realtime.key").remove("realtime.base").remove("realtime.voice");
        else{JSONObject c=validate(json);edit.putString("realtime.key",c.getString("apiKey")).putString("realtime.base",c.getString("base")).putString("realtime.voice",c.getString("voice"));}
        if(!edit.commit())throw new IllegalStateException("实时语音设置未保存。");
    }
}
