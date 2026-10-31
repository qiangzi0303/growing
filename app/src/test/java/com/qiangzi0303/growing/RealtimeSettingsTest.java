package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import org.json.JSONObject;
import org.junit.Test;

public class RealtimeSettingsTest {
    @Test public void acceptsPersonalWorkspaceAndVoice() throws Exception {
        JSONObject c=RealtimeSettings.validate("{\"apiKey\":\"test-only-key\",\"base\":\"https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1\",\"voice\":\"Tina\"}");
        assertEquals("https://workspace.cn-beijing.maas.aliyuncs.com",c.getString("base"));
        assertEquals("Tina",c.getString("voice"));
        assertEquals("",RealtimeSettings.validate("{}").getString("apiKey"));
    }
    @Test public void rejectsCredentialRedirectsAndInvalidValues() throws Exception {
        for(String base:new String[]{"http://dashscope.aliyuncs.com","https://unrelated.example","https://dashscope.aliyuncs.com.evil.example","https://key@dashscope.aliyuncs.com","https://dashscope.aliyuncs.com?key=private"}){
            try{RealtimeSettings.validate(new JSONObject().put("base",base).toString());fail(base);}catch(IllegalArgumentException expected){}
        }
        for(String key:new String[]{"short","key with spaces"}){
            try{RealtimeSettings.validate(new JSONObject().put("apiKey",key).toString());fail("bad key");}catch(IllegalArgumentException expected){}
        }
    }
    @Test public void microphoneRequiresTrustedPageAndAudioOnly(){
        String origin="https://appassets.androidplatform.net",page=origin+"/assets/web/app-design/companion-duck/index.html";
        String[] audio={"android.webkit.resource.AUDIO_CAPTURE"};
        assertTrue(MicrophonePolicy.permits(origin,page,audio));
        assertFalse(MicrophonePolicy.permits("https://unrelated.example",page,audio));
        assertFalse(MicrophonePolicy.permits(origin,"https://unrelated.example",audio));
        assertFalse(MicrophonePolicy.permits(origin,page,new String[]{"android.webkit.resource.VIDEO_CAPTURE"}));
        assertFalse(MicrophonePolicy.permits(origin,page,new String[]{audio[0],"android.webkit.resource.VIDEO_CAPTURE"}));
    }
}
