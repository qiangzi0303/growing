package com.qiangzi0303.growing;

import java.util.UUID;
import org.json.JSONObject;

/** Only cache a completed cloud identity; a local registration is not confirmation. */
final class NativeIdentity {
    final String id, role;
    NativeIdentity(JSONObject profile) throws Exception {
        id = profile.getString("id");
        if (!UUID.fromString(id).toString().equalsIgnoreCase(id)) throw new IllegalArgumentException("云账号编号不正确。");
        role = profile.getString("role");
        if (!role.equals("Admin") && !(profile.has("roleSelectionRequired")
                && profile.get("roleSelectionRequired").equals(Boolean.FALSE)
                && (role.equals("Student") || role.equals("Parent"))))
            throw new IllegalArgumentException("请先选择学生或家长，并保存到后台。");
    }
    void requireSameAccount(NativeIdentity previous) {
        if (previous != null && (!id.equals(previous.id) || !role.equals(previous.role)))
            throw new IllegalArgumentException("此本机账号已关联其他云账号或身份，请使用原云账号，或退出本机账号后切换。");
    }
    String json() throws Exception { return new JSONObject().put("id",id).put("role",role).put("roleSelectionRequired",false).toString(); }
}
