package com.qiangzi0303.growing;

import java.util.UUID;
import org.json.JSONObject;

/** Offline storage tests seed a confirmed cloud identity; onboarding is tested separately. */
final class IdentityFixtures {
    static void student(AccountStore accounts) throws Exception {
        if(accounts.identity(accounts.currentId())==null)
            accounts.confirmIdentity(accounts.currentId(),new JSONObject().put("id",UUID.randomUUID().toString()).put("role","Student").put("roleSelectionRequired",false).toString());
    }
}
