package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Exercises the actual document-start adapter and Android JavascriptInterface round trip. */
@RunWith(AndroidJUnit4.class)
public class SpeechTest {
    private WebView web(View view){
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView found=web(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private String js(ActivityScenario<MainActivity> scenario,String source) throws Exception{
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();
        scenario.onActivity(activity->{WebView view=web(activity.getWindow().getDecorView());
            if(view==null){value.set("missing-webview");latch.countDown();return;}
            view.evaluateJavascript(source,result->{value.set(result);latch.countDown();});});
        assertTrue(latch.await(15,TimeUnit.SECONDS));return value.get();
    }
    @Test public void nativeSpeechRoundTrip() throws Exception{
        Context context=ApplicationProvider.getApplicationContext();
        AccountStore accounts=new AccountStore(context);
        if(accounts.currentId()==null)accounts.authenticate("speech_student","Speech-Test-Password-2026".toCharArray(),true);
        IdentityFixtures.student(accounts);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            boolean ready=false;
            for(int i=0;i<60;i++){
                if("true".equals(js(scenario,"document.readyState==='complete' && !!window.GrowingSpeech && !!window.__growingSpeechEvent"))){ready=true;break;}
                Thread.sleep(200);
            }
            assertTrue("Native speech adapter did not load",ready);
            // Deliberately too long: must return an error from Java through the real WebView bridge.
            js(scenario,"window.speechResult='waiting';var u=new SpeechSynthesisUtterance('a'.repeat(5000));u.onerror=e=>window.speechResult=e.error;speechSynthesis.speak(u);");
            for(int i=0;i<50 && !"\"invalid-argument\"".equals(js(scenario,"window.speechResult"));i++)Thread.sleep(100);
            assertEquals("\"invalid-argument\"",js(scenario,"window.speechResult"));
            assertEquals("false",js(scenario,"speechSynthesis.speaking"));
            // The emulator may have no installed TTS voice. Success or an explicit native error
            // are valid here; neither is evidence of audible playback on the user's phone.
            js(scenario,"window.speechResult='waiting';var v=new SpeechSynthesisUtterance('Hello, welcome to Growing.');v.lang='en-GB';v.onend=()=>window.speechResult='end';v.onerror=e=>window.speechResult=e.error;speechSynthesis.speak(v);");
            String result="\"waiting\"";
            for(int i=0;i<150;i++){
                result=js(scenario,"window.speechResult");if(!"\"waiting\"".equals(result))break;
                Thread.sleep(200);
            }
            assertTrue("Unexpected native TTS outcome: "+result,
                result.equals("\"end\"") || result.equals("\"language-unavailable\"")
                || result.equals("\"synthesis-unavailable\"") || result.equals("\"synthesis-failed\""));
            System.out.println("Native Android TTS outcome: "+result);
            js(scenario,"speechSynthesis.speak(new SpeechSynthesisUtterance('cancel test'));speechSynthesis.cancel();");
            assertEquals("false",js(scenario,"speechSynthesis.speaking || speechSynthesis.pending"));
        }
    }
}
