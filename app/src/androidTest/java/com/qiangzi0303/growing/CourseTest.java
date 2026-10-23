package com.qiangzi0303.growing;

import static org.junit.Assert.*;
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

/** Exercise the shipped new course iframe with the actual document-start native bridge. */
@RunWith(AndroidJUnit4.class)
public class CourseTest {
    private WebView web(View v){if(v instanceof WebView)return (WebView)v;if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++){WebView found=web(g.getChildAt(i));if(found!=null)return found;}}return null;}
    private String js(ActivityScenario<MainActivity> s,String source) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        s.onActivity(a->{WebView w=web(a.getWindow().getDecorView());assertNotNull(w);w.evaluateJavascript(source,v->{result.set(v);latch.countDown();});});
        assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void ready(ActivityScenario<MainActivity> s,String expression) throws Exception {for(int i=0;i<100;i++){if("true".equals(js(s,expression)))return;Thread.sleep(200);}fail("Packaged course or native bridge did not load");}
    @Test public void offlineCourseAndRewards() throws Exception {
        AccountStore accounts=new AccountStore(ApplicationProvider.getApplicationContext());accounts.logout();accounts.authenticate("course_check","Course-Test-Password-2026".toCharArray(),true);
        IdentityFixtures.student(accounts);
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            ready(s,"!!document.querySelector('.subjects')");
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=math&term=upper&unit=math-8a-03'");
            ready(s,"(()=>{const f=document.querySelector('iframe');return !!(f&&f.contentDocument&&f.contentDocument.querySelector('.unit-reward-trigger'));})()");
            assertEquals("0",js(s,"document.querySelector('iframe').contentDocument.querySelectorAll('.unit-reward-summary').length"));
            js(s,"document.querySelector('iframe').contentDocument.querySelector('.unit-reward-trigger').click()");
            ready(s,"!!document.querySelector('iframe').contentDocument.querySelector('dialog[open] .unit-reward-summary')");
            assertEquals("200",js(s,"JSON.parse(document.querySelector('iframe').contentWindow.localStorage.getItem('growing-unit-rewards-v1:math-8a-03')).config.cashYuan"));
            assertEquals("false",js(s,"Object.getOwnPropertyDescriptor(document.querySelector('iframe').contentWindow,'localStorage').configurable"));
            js(s,"document.querySelector('iframe').contentWindow.localStorage.setItem('course.iframe','native-bridge-ok')");
            assertEquals("\"native-bridge-ok\"",js(s,"localStorage.getItem('course.iframe')"));
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/knowledge.html?chapter=math-8b-09&mode=panorama&range=year'");
            ready(s,"document.body.classList.contains('is-panorama') && !!document.querySelector('svg')");
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=physics&term=upper&unit=physics-8a-01'");
            ready(s,"(()=>{const f=document.querySelector('iframe');return !!(f&&f.contentWindow.GrowingCourseAI&&f.contentDocument.querySelector('.course-tools-nav'));})()");
            assertEquals("true",js(s,"document.querySelector('iframe').contentWindow.GrowingCourseAI.info().native"));
            assertEquals("5",js(s,"document.querySelector('iframe').contentDocument.querySelectorAll('.course-tools-nav button').length"));
            assertEquals("\"native-bridge-ok\"",js(s,"document.querySelector('iframe').contentWindow.localStorage.getItem('course.iframe')"));
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=english&term=upper&unit=english-8a-01'");
            ready(s,"(()=>{const f=document.querySelector('iframe');return !!(f&&f.contentWindow.GrowingCourseAI&&f.contentDocument.querySelector('#word-detail'));})()");
            assertEquals("true",js(s,"document.querySelector('iframe').contentWindow.GrowingCourseAI.info().native"));
            js(s,"document.querySelector('iframe').contentDocument.querySelector('[data-view=settings]').click()");
            ready(s,"!!document.querySelector('iframe').contentDocument.querySelector('[data-course-ai-native]')");
        }
    }
}
