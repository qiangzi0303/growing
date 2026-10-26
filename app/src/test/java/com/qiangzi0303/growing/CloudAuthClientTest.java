package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.junit.Test;

public class CloudAuthClientTest {
    private static final String ID="00000000-0000-4000-8000-000000000001";
    private JSONObject result() throws Exception {
        return new JSONObject().put("token","a".repeat(64)).put("user",new JSONObject().put("id",ID).put("username","child").put("role","Student").put("roleSelectionRequired",false));
    }
    private static class Connection extends HttpURLConnection {
        ByteArrayOutputStream sent=new ByteArrayOutputStream();int code=200;String body;boolean disconnected;
        Connection(URL url,String body){super(url);this.body=body;}
        public void connect(){} public boolean usingProxy(){return false;} public void disconnect(){disconnected=true;}
        public OutputStream getOutputStream(){return sent;} public int getResponseCode(){return code;}
        public InputStream getInputStream(){return new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8));}
    }
    @Test public void existingCloudAccountCanLoginWithoutLocalRegistration() throws Exception {
        Connection c=new Connection(new URL("https://learn.test/api/auth/login"),result().toString());
        JSONObject saved=new CloudAuthClient("https://learn.test",url->{assertEquals("/api/auth/login",url.getPath());return c;}).authenticate("child","test-password".toCharArray(),false,"Student");
        assertEquals(ID,saved.getJSONObject("user").getString("id"));
        assertEquals("POST",c.getRequestMethod());assertEquals("1",c.getRequestProperty("X-Growing-Client"));
        assertEquals("test-password",new JSONObject(c.sent.toString("UTF-8")).getString("password"));
        assertFalse(c.getInstanceFollowRedirects());assertTrue(c.disconnected);
    }
    @Test public void registrationSendsExplicitRoleAndNeverTreatsFailureAsLocalSuccess() throws Exception {
        Connection c=new Connection(new URL("https://learn.test"),result().toString());
        CloudAuthClient client=new CloudAuthClient("https://learn.test",url->{assertEquals("/api/auth/register",url.getPath());return c;});
        client.authenticate("child","test-password".toCharArray(),true,"Student");
        assertEquals("Student",new JSONObject(c.sent.toString("UTF-8")).getString("role"));
        c.code=409;assertThrows(CloudAuthClient.Rejected.class,()->client.authenticate("child","test-password".toCharArray(),true,"Student"));
    }
    @Test public void rejectsAnotherIdentityMalformedTokenAndInsecureAddress() throws Exception {
        assertThrows(CloudAuthClient.Rejected.class,()->CloudAuthClient.validate(result(),"another"));
        assertThrows(CloudAuthClient.Rejected.class,()->CloudAuthClient.validate(result().put("token","bad"),"child"));
        assertThrows(CloudAuthClient.Rejected.class,()->new CloudAuthClient("http://learn.test").authenticate("child","test-password".toCharArray(),false,"Student"));
    }
    @Test public void networkFailureDoesNotCreateAnOfflineCloudIdentity() throws Exception {
        CloudAuthClient client=new CloudAuthClient("https://learn.test",url->{throw new IOException("test disconnect");});
        assertThrows(IOException.class,()->client.authenticate("child","test-password".toCharArray(),false,"Student"));
    }
}
