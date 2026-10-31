package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.app.UiAutomation;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.webkit.WebView;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Actual WebView capture, local SDP negotiation/RTP, bridge storage and lifecycle. No provider calls. */
@RunWith(AndroidJUnit4.class)
public class RealtimeWebRtcTest {
    private WebView find(View view){
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView found=find(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private String js(ActivityScenario<MainActivity> scenario,String source)throws Exception{
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        scenario.onActivity(a->{WebView view=find(a.getWindow().getDecorView());assertNotNull(view);view.evaluateJavascript(source,value->{result.set(value);done.countDown();});});
        assertTrue(done.await(15,TimeUnit.SECONDS));return result.get();
    }
    @Test public void captureRtpAndStopWhenBackgrounded()throws Exception{
        Context context=ApplicationProvider.getApplicationContext();AccountStore accounts=new AccountStore(context);
        if(accounts.currentId()==null)accounts.authenticate("rtc_student","Realtime-Test-Password-2026".toCharArray(),true);
        IdentityFixtures.student(accounts);
        UiAutomation automation=InstrumentationRegistry.getInstrumentation().getUiAutomation();
        AccessibilityServiceInfo accessibility=automation.getServiceInfo();
        accessibility.flags|=AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;automation.setServiceInfo(accessibility);
        String html;
        try(InputStream stream=InstrumentationRegistry.getInstrumentation().getContext().getAssets().open("realtime-webrtc.html");ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;while((count=stream.read(buffer))!=-1)bytes.write(buffer,0,count);
            html=new String(bytes.toByteArray(),StandardCharsets.UTF_8);
        }
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            final String fixture=html;
            // Use the trusted URL for the history entry too; null is exposed by WebView as about:blank.
            String fixtureUrl="https://appassets.androidplatform.net/assets/web/app-design/rtc-test.html";
            scenario.onActivity(a->find(a.getWindow().getDecorView()).loadDataWithBaseURL(fixtureUrl,fixture,"text/html","UTF-8",fixtureUrl));
            for(int i=0;i<100&&!"true".equals(js(scenario,"!!window.rtcResult && !!window.GrowingNative"));i++)Thread.sleep(100);
            assertEquals("true",js(scenario,"!!window.rtcResult && !!window.GrowingNative"));
            assertEquals("true",js(scenario,"JSON.parse(GrowingNative.saveRealtimeSettings(JSON.stringify({apiKey:'test-native-rtc-key',voice:'Tina',base:'https://dashscope.aliyuncs.com'}))).ok && JSON.parse(GrowingNative.realtimeSettings()).value.voice==='Tina'"));
            js(scenario,"document.getElementById('start').click()");
            for(int i=0;i<100&&context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED;i++){
                // Exercise Android's first-use prompt on CI (permission is revoked before launch).
                AccessibilityNodeInfo root=automation.getRootInActiveWindow();
                if(root!=null)for(String owner:new String[]{"com.android.permissioncontroller","com.google.android.permissioncontroller"}){
                    for(AccessibilityNodeInfo node:root.findAccessibilityNodeInfosByViewId(owner+":id/permission_allow_foreground_only_button"))node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                }
                Thread.sleep(100);
            }
            assertEquals("Runtime microphone permission; fixture="+js(scenario,"JSON.stringify({result:window.rtcResult,url:location.href,visible:document.visibilityState})"),PackageManager.PERMISSION_GRANTED,context.checkSelfPermission(Manifest.permission.RECORD_AUDIO));
            String result="";
            for(int i=0;i<300;i++){result=js(scenario,"window.rtcResult.state");if(result.equals("\"passed\"")||result.equals("\"failed\""))break;Thread.sleep(100);}
            assertEquals("RTP/capture state: "+js(scenario,"JSON.stringify(window.rtcResult)"),"\"passed\"",result);
            scenario.moveToState(Lifecycle.State.CREATED);scenario.moveToState(Lifecycle.State.RESUMED);
            for(int i=0;i<40&&!"true".equals(js(scenario,"testStream.getTracks().every(t=>t.readyState==='ended')"));i++)Thread.sleep(100);
            assertEquals("true",js(scenario,"testStream.getTracks().every(t=>t.readyState==='ended') && left.connectionState==='closed' && right.connectionState==='closed'"));
            js(scenario,"GrowingNative.saveRealtimeSettings('null')");
        }
    }
}
