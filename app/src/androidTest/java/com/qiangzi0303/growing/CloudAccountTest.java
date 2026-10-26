package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class CloudAccountTest {
    private JSONObject login(String name,String id) throws Exception {
        return new JSONObject().put("token","a".repeat(64)).put("user",new JSONObject().put("id",id).put("username",name).put("displayName",name).put("role","Student").put("roleSelectionRequired",false));
    }
    @Test public void newDeviceLoginCreatesOnlyACacheAndKeepsStudentsSeparate() throws Exception {
        Context c=ApplicationProvider.getApplicationContext();AccountStore a=new AccountStore(c);a.logout();
        String name="cloud_"+Long.toString(System.nanoTime(),36),id=java.util.UUID.randomUUID().toString();
        assertEquals(id,a.loginCloud(name,"Cloud-Test-Password".toCharArray(),login(name,id)));
        assertEquals(id,a.identity(id).id);
        assertTrue(c.getSharedPreferences("learning-v1-"+id,0).edit().putString("growing-math-lessons-v1","{\"version\":1,\"topics\":{}}").commit());
        a.logout();String other=name+"b",otherId=java.util.UUID.randomUUID().toString();
        a.loginCloud(other,"Cloud-Test-Password".toCharArray(),login(other,otherId));
        assertFalse(c.getSharedPreferences("learning-v1-"+otherId,0).contains("growing-math-lessons-v1"));
        a.logout();assertEquals(id,a.loginCloud(name,"Updated-Cloud-Password".toCharArray(),login(name,id)));
        assertTrue(c.getSharedPreferences("learning-v1-"+id,0).contains("growing-math-lessons-v1"));
        a.logout();assertEquals(id,a.authenticate(name,"Updated-Cloud-Password".toCharArray(),false));
    }
    @Test public void legacyRecordsKeepTheirNamespaceAndCannotBeClaimedByAnotherCloudIdentity() throws Exception {
        Context c=ApplicationProvider.getApplicationContext();AccountStore a=new AccountStore(c);a.logout();
        String name="migrate_"+Long.toString(System.nanoTime(),36),id=a.authenticate(name,"Legacy-Test-Password".toCharArray(),true);
        assertTrue(c.getSharedPreferences("learning-v1-"+id,0).edit().putString("growing-assessment-v1","{\"version\":1}").commit());
        String cloudId=java.util.UUID.randomUUID().toString();
        assertThrows(IllegalArgumentException.class,()->a.loginCloud(name,"Cloud-Test-Password".toCharArray(),login(name,cloudId)));
        a.confirmIdentity(id,login(name,cloudId).getJSONObject("user").toString());a.logout();
        assertEquals(id,a.loginCloud(name,"Cloud-Test-Password".toCharArray(),login(name,cloudId)));
        assertEquals("{\"version\":1}",c.getSharedPreferences("learning-v1-"+id,0).getString("growing-assessment-v1",null));
        assertThrows(IllegalArgumentException.class,()->a.loginCloud(name,"Cloud-Test-Password".toCharArray(),login(name,java.util.UUID.randomUUID().toString())));
        assertEquals(cloudId,a.identity(id).id);
    }
}
