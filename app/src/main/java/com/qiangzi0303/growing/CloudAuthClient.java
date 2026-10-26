package com.qiangzi0303.growing;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/** Cloud identity works on a new device without first creating a local account. */
final class CloudAuthClient {
    static final class Rejected extends Exception {
        Rejected(String message) { super(message); }
    }
    private final String origin;
    interface ConnectionFactory { HttpURLConnection open(URL url) throws IOException; }
    private final ConnectionFactory connections;
    CloudAuthClient(String origin) { this(origin,url->(HttpURLConnection)url.openConnection()); }
    CloudAuthClient(String origin,ConnectionFactory connections) { this.origin=origin;this.connections=connections; }
    JSONObject authenticate(String username,char[] password,boolean register,String role) throws Exception {
        if(origin.isEmpty())throw new Rejected("此安装包尚未配置云服务，请更新安装包。");
        URL url=new URL(origin+"/api/auth/"+(register?"register":"login"));
        if(!"https".equals(url.getProtocol()))throw new Rejected("云登录地址必须使用 HTTPS。");
        HttpURLConnection connection=connections.open(url);
        try {
            connection.setRequestMethod("POST");connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(8000);connection.setReadTimeout(12000);connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type","application/json; charset=utf-8");
            connection.setRequestProperty("X-Growing-Client","1");
            JSONObject body=new JSONObject().put("username",username.trim()).put("password",new String(password));
            if(register)body.put("displayName",username.trim()).put("role",role);
            byte[] payload=body.toString().getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(payload.length);
            try(java.io.OutputStream output=connection.getOutputStream()){output.write(payload);}
            int status=connection.getResponseCode();
            if(status!=200)throw new Rejected(status==401?"云账号或密码不正确。旧本机账号请使用「旧本机账号迁移」。":status==409?"云账号已存在，请直接登录。":status==429?"尝试较多，请稍后再登录。":"云登录未完成（"+status+"），请稍后重试。");
            try(InputStream input=connection.getInputStream()) {
                ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buffer=new byte[4096];int n;
                while((n=input.read(buffer))!=-1){if(bytes.size()+n>32768)throw new Rejected("云登录响应异常，请重试。");bytes.write(buffer,0,n);}
                return validate(new JSONObject(bytes.toString(StandardCharsets.UTF_8.name())),username);
            }
        } finally { connection.disconnect(); }
    }
    static JSONObject validate(JSONObject result,String username) throws Exception {
        JSONObject profile=result.getJSONObject("user");
        String id=profile.getString("id");
        if(!java.util.UUID.fromString(id).toString().equalsIgnoreCase(id)
                ||!profile.getString("username").equalsIgnoreCase(username.trim())
                ||!result.getString("token").matches("[a-f0-9]{64}")
                ||!java.util.Arrays.asList("Student","Parent","Admin").contains(profile.getString("role")))
            throw new Rejected("云登录响应异常，未切换账号。");
        return result;
    }
}
