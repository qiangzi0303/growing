package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.EditText;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs on a tablet-sized emulator, including a narrower split-window size. */
@RunWith(AndroidJUnit4.class)
public class TabletTest {
    private View find(View view,String description){
        if(description.equals(String.valueOf(view.getContentDescription())))return view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){View found=find(group.getChildAt(i),description);if(found!=null)return found;}}
        return null;
    }
    private WebView web(View view){
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView found=web(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private void rotate(ActivityScenario<MainActivity> scenario,int requested,int expected) throws Exception {
        scenario.onActivity(a->a.setRequestedOrientation(requested));
        for(int i=0;i<100;i++){
            AtomicReference<Boolean> ready=new AtomicReference<>(false);
            scenario.onActivity(a->{View content=a.findViewById(android.R.id.content);ready.set(a.getResources().getConfiguration().orientation==expected && (expected==Configuration.ORIENTATION_LANDSCAPE?content.getWidth()>content.getHeight():content.getHeight()>content.getWidth()));});
            if(ready.get())return;
            Thread.sleep(100);
        }
        fail("Tablet window did not finish rotating");
    }
    private String js(ActivityScenario<MainActivity> scenario,String source) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        scenario.onActivity(a->{WebView view=web(a.getWindow().getDecorView());assertNotNull(view);view.evaluateJavascript(source,v->{result.set(v);latch.countDown();});});
        assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void ready(ActivityScenario<MainActivity> scenario,String expression) throws Exception {
        for(int i=0;i<100;i++){if("true".equals(js(scenario,expression)))return;Thread.sleep(100);}
        fail("Tablet course did not load");
    }
    @Test public void loginDraftAndFormSurviveRotation() throws Exception {
        new AccountStore(ApplicationProvider.getApplicationContext()).logout();
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            AtomicReference<MainActivity> original=new AtomicReference<>();
            scenario.onActivity(a->{original.set(a);((EditText)find(a.getWindow().getDecorView(),"用户名")).setText("tablet_draft");((EditText)find(a.getWindow().getDecorView(),"密码")).setText("Unsubmitted-password");});
            rotate(scenario,ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,Configuration.ORIENTATION_LANDSCAPE);
            rotate(scenario,ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,Configuration.ORIENTATION_PORTRAIT);
            scenario.onActivity(a->{
                assertSame("Resizing must preserve the live native form",original.get(),a);
                EditText name=(EditText)find(a.getWindow().getDecorView(),"用户名");
                assertEquals("tablet_draft",name.getText().toString());
                assertEquals("Unsubmitted-password",((EditText)find(a.getWindow().getDecorView(),"密码")).getText().toString());
                View form=(View)name.getParent();
                int max=Math.round(560*a.getResources().getDisplayMetrics().density);
                assertTrue("Login form must have a readable tablet width",form.getWidth()<=max);
                View container=(View)form.getParent();
                assertTrue("Login form must stay centered",Math.abs(form.getLeft()-(container.getWidth()-form.getWidth())/2)<=2);
            });
        }
    }
    @Test public void lessonAndUnsubmittedAnswerSurviveRotation() throws Exception {
        AccountStore accounts=new AccountStore(ApplicationProvider.getApplicationContext());accounts.logout();
        accounts.authenticate("pad_"+Long.toString(System.nanoTime(),36),"Tablet-Test-Password-2026".toCharArray(),true);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario,"!!document.querySelector('.subjects')");
            js(scenario,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=math&term=upper&unit=math-8a-03'");
            ready(scenario,"!!document.querySelector('iframe')?.contentDocument?.querySelector('#mark-read')");
            js(scenario,"document.querySelector('iframe').contentDocument.querySelector('#mark-read').click()");
            ready(scenario,"!!document.querySelector('iframe').contentDocument.querySelector('#recall-text')");
            js(scenario,"document.querySelector('iframe').contentDocument.querySelector('#recall-text').value='Tablet answer, not submitted';window.tabletLiveState='preserved'");
            AtomicReference<WebView> original=new AtomicReference<>();scenario.onActivity(a->original.set(web(a.getWindow().getDecorView())));
            rotate(scenario,ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,Configuration.ORIENTATION_LANDSCAPE);
            assertEquals("\"preserved\"",js(scenario,"window.tabletLiveState"));
            assertEquals("\"Tablet answer, not submitted\"",js(scenario,"document.querySelector('iframe').contentDocument.querySelector('#recall-text').value"));
            assertEquals("true",js(scenario,"document.documentElement.scrollWidth<=innerWidth && document.querySelector('iframe').contentDocument.documentElement.scrollWidth<=document.querySelector('iframe').contentWindow.innerWidth"));
            rotate(scenario,ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,Configuration.ORIENTATION_PORTRAIT);
            scenario.onActivity(a->assertSame("Rotation must preserve the current WebView",original.get(),web(a.getWindow().getDecorView())));
            assertEquals("\"Tablet answer, not submitted\"",js(scenario,"document.querySelector('iframe').contentDocument.querySelector('#recall-text').value"));
        }
    }
}
