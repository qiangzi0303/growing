package com.qiangzi0303.growing;

import java.util.UUID;
import org.json.JSONObject;

/** Offline storage tests seed a confirmed cloud identity; onboarding is tested separately. */
final class IdentityFixtures {
    static void enterCache(androidx.test.core.app.ActivityScenario<MainActivity> scenario) {
        // These offline course tests deliberately select the already confirmed cache.
        // Cloud restore and its entry gate are covered by NativeRoleTest and browser/D1 tests.
        scenario.onActivity(activity->{AccountStore accounts=new AccountStore(activity);activity.openLearning(accounts.currentId(),0);});
    }
    static void student(AccountStore accounts) throws Exception {
        if(accounts.identity(accounts.currentId())==null)
            accounts.confirmIdentity(accounts.currentId(),new JSONObject().put("id",UUID.randomUUID().toString()).put("role","Student").put("roleSelectionRequired",false).toString());
    }
}
