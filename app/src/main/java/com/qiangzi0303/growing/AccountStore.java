package com.qiangzi0303.growing;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;
import org.json.JSONObject;

/** Local cache of cloud identities, plus the original accounts kept for migration. */
public final class AccountStore {
    private final SharedPreferences prefs;
    private final Context context;
    public AccountStore(Context context) { this.context=context; prefs = context.getSharedPreferences("accounts-v1", Context.MODE_PRIVATE); }
    public String currentId() { return prefs.getString("session.id", null); }
    public String currentName() { return prefs.getString("session.name", ""); }
    NativeIdentity identity(String accountId) {
        try { return new NativeIdentity(new JSONObject(prefs.getString("identity."+accountId, ""))); }
        catch (Exception e) { return null; }
    }
    private String cloudOwner(String accountId) {
        NativeIdentity identity=identity(accountId);if(identity!=null)return identity.id;
        SharedPreferences learning=context.getSharedPreferences("learning-v1-"+accountId,Context.MODE_PRIVATE);
        String binding=learning.getString("growing-cloud-binding-v1",null);if(binding!=null)return binding;
        try{return new JSONObject(learning.getString("growing-cloud-session-v1","")).getJSONObject("user").getString("id");}
        catch(Exception e){return null;}
    }
    synchronized void confirmIdentity(String accountId, String profile) throws Exception {
        if (accountId == null || !accountId.equals(currentId())) throw new SecurityException("登录已失效。");
        NativeIdentity confirmed = new NativeIdentity(new JSONObject(profile));
        confirmed.requireSameAccount(identity(accountId));
        if (!prefs.edit().putString("identity."+accountId, confirmed.json()).commit())
            throw new IllegalStateException("身份未能保存在本机，请重试。");
    }
    synchronized String confirmCloudSession(String accountId,String session) throws Exception {
        if(accountId==null||!accountId.equals(currentId()))throw new SecurityException("登录已失效，请重新登录。");
        JSONObject result=new JSONObject(session),profile=result.getJSONObject("user");
        CloudAuthClient.validate(result,profile.getString("username"));
        String cloudId=profile.getString("id"),binding=cloudOwner(accountId);
        String id=binding==null||cloudId.equals(binding)?accountId:cloudId;
        if(binding!=null&&!cloudId.equals(binding)){
            String known=prefs.getString("user."+profile.getString("username").toLowerCase(Locale.ROOT),null);
            if(known!=null){String localId=new JSONObject(known).getString("id");
                if(cloudId.equals(cloudOwner(localId)))id=localId;}
        }
        boolean confirmed=profile.getString("role").equals("Admin")||Boolean.FALSE.equals(profile.opt("roleSelectionRequired"));
        NativeIdentity identity=confirmed?new NativeIdentity(profile):null;
        SharedPreferences.Editor learning=context.getSharedPreferences("learning-v1-"+id,Context.MODE_PRIVATE).edit()
            .putString("growing-cloud-session-v1",session).putString("growing-cloud-binding-v1",cloudId);
        if(!learning.commit())throw new IllegalStateException("云登录未保存到设备，请重试。");
        SharedPreferences.Editor edit=prefs.edit().putString("session.id",id).putString("session.name",profile.getString("username"));
        if(identity!=null)edit.putString("identity."+id,identity.json());else edit.remove("identity."+id);
        if(!edit.commit())throw new IllegalStateException("登录状态未保存，请重试。");
        return id;
    }
    public void logout() {
        if (!prefs.edit().remove("session.id").remove("session.name").commit()) throw new IllegalStateException("无法保存退出状态，请重试。");
    }
    synchronized String loginCloud(String username,char[] password,JSONObject result) throws Exception {
        try {
            CloudAuthClient.validate(result,username);
            JSONObject profile=result.getJSONObject("user");String cloudId=profile.getString("id");
            String key="user."+username.trim().toLowerCase(Locale.ROOT),raw=prefs.getString(key,null);
            JSONObject previous=raw==null?null:new JSONObject(raw);
            // Keep migrated device records in their original namespace.
            String id=cloudId;
            if(previous!=null){
                String previousId=previous.getString("id");
                if(previousId.equals(cloudId)||cloudId.equals(cloudOwner(previousId)))id=previousId;
                else key="cloud."+key; // Keep the old local login and its records available for migration.
            }
            byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);
            JSONObject local=new JSONObject().put("id",id).put("name",profile.getString("username"))
                .put("salt",Base64.encodeToString(salt,Base64.NO_WRAP)).put("iterations",PasswordHasher.ITERATIONS)
                .put("hash",Base64.encodeToString(PasswordHasher.hash(password,salt,PasswordHasher.ITERATIONS),Base64.NO_WRAP));
            SharedPreferences.Editor learning=context.getSharedPreferences("learning-v1-"+id,Context.MODE_PRIVATE).edit()
                .putString("growing-cloud-session-v1",new JSONObject().put("token",result.getString("token")).put("user",profile).toString())
                .putString("growing-cloud-binding-v1",cloudId);
            if(!learning.commit())throw new IllegalStateException("云登录未保存到设备，请重试。");
            SharedPreferences.Editor edit=prefs.edit().putString(key,local.toString()).putString("session.id",id)
                .putString("session.name",profile.getString("username")).remove("failed.count").remove("locked.until");
            if(profile.getString("role").equals("Admin")||Boolean.FALSE.equals(profile.opt("roleSelectionRequired")))
                edit.putString("identity."+id,new NativeIdentity(profile).json());
            else edit.remove("identity."+id);
            if(!edit.commit())throw new IllegalStateException("登录状态未保存，请重试。");
            return id;
        } finally {Arrays.fill(password,'\0');}
    }
    public synchronized String authenticate(String username, char[] password, boolean register) throws Exception {
        username = username.trim();
        try {
            if (!username.matches("[\\p{L}\\p{N}_]{2,24}")) throw new IllegalArgumentException("用户名为 2—24 个字母、数字、中文或下划线。");
            if (password.length < 8 || password.length > 128) throw new IllegalArgumentException("密码长度为 8—128 个字符。");
            if (System.currentTimeMillis() < prefs.getLong("locked.until", 0)) throw new IllegalArgumentException("尝试较多，请稍后一分钟再登录。");
            String key = "user." + username.toLowerCase(Locale.ROOT);
            String raw = prefs.getString(key, null);
            JSONObject user;
            if (register) {
                if (raw != null || prefs.contains("cloud."+key)) throw new IllegalArgumentException("这个用户名已在本机注册，请登录或换一个用户名。");
                byte[] salt = new byte[16]; new SecureRandom().nextBytes(salt);
                byte[] hash = PasswordHasher.hash(password, salt, PasswordHasher.ITERATIONS);
                user = new JSONObject().put("id", UUID.randomUUID().toString()).put("name", username)
                    .put("salt", Base64.encodeToString(salt, Base64.NO_WRAP)).put("iterations", PasswordHasher.ITERATIONS)
                    .put("hash", Base64.encodeToString(hash, Base64.NO_WRAP));
                if (!prefs.edit().putString(key, user.toString()).commit()) throw new IllegalStateException("注册未保存，请检查手机存储后重试。");
            } else {
                boolean valid = false;
                user = raw == null ? null : new JSONObject(raw);
                if (user != null) valid = PasswordHasher.verify(password, Base64.decode(user.getString("salt"), Base64.NO_WRAP),
                    user.getInt("iterations"), Base64.decode(user.getString("hash"), Base64.NO_WRAP));
                else PasswordHasher.hash(password, new byte[16], PasswordHasher.ITERATIONS);
                if(!valid&&prefs.contains("cloud."+key)){
                    JSONObject cached=new JSONObject(prefs.getString("cloud."+key,""));
                    valid=PasswordHasher.verify(password,Base64.decode(cached.getString("salt"),Base64.NO_WRAP),cached.getInt("iterations"),Base64.decode(cached.getString("hash"),Base64.NO_WRAP));
                    if(valid)user=cached;
                }
                if (!valid) {
                    int failures = prefs.getInt("failed.count", 0) + 1;
                    prefs.edit().putInt("failed.count", failures >= 6 ? 0 : failures)
                        .putLong("locked.until", failures >= 6 ? System.currentTimeMillis() + 60_000 : 0).commit();
                    throw new IllegalArgumentException("用户名或密码不正确。");
                }
            }
            if (!prefs.edit().putString("session.id", user.getString("id")).putString("session.name", user.getString("name"))
                .remove("failed.count").remove("locked.until").commit()) throw new IllegalStateException("登录状态未保存，请重试。");
            return user.getString("id");
        } finally { Arrays.fill(password, '\0'); }
    }
}
