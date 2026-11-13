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

/** Exercise direct course navigation with the actual document-start native bridge. */
@RunWith(AndroidJUnit4.class)
public class CourseTest {
    private WebView web(View v){if(v instanceof WebView)return (WebView)v;if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++){WebView found=web(g.getChildAt(i));if(found!=null)return found;}}return null;}
    private String js(ActivityScenario<MainActivity> s,String source) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        s.onActivity(a->{WebView w=web(a.getWindow().getDecorView());assertNotNull(w);w.evaluateJavascript(source,v->{result.set(v);latch.countDown();});});
        assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void ready(ActivityScenario<MainActivity> s,String expression) throws Exception {for(int i=0;i<100;i++){if("true".equals(js(s,expression)))return;Thread.sleep(200);}fail("Course check timed out: "+expression+"; page="+js(s,"location.href")+"; diagnostics="+js(s,"JSON.stringify({fallback:document.querySelector('[data-student-fallback]')?.textContent,vue:document.querySelector('[data-student-vue]')?.outerHTML.slice(0,500),text:document.body.innerText.slice(-1500)})"));}
    @Test public void offlineCourseAndRewards() throws Exception {
        AccountStore accounts=new AccountStore(ApplicationProvider.getApplicationContext());accounts.logout();accounts.authenticate("course_check","Course-Test-Password-2026".toCharArray(),true);
        IdentityFixtures.student(accounts);
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            IdentityFixtures.enterCache(s);
            ready(s,"!!document.querySelector('.subjects')");
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=math&term=upper&unit=math-8a-03'");
            ready(s,"location.pathname.endsWith('/math-course.html') && !!document.querySelector('.student-math-course .lesson-tabs') && !!window.GrowingCourseAccount");
            js(s,"GrowingCourseAccount.open('settings')");
            ready(s,"!!document.querySelector('.student-course-settings')");
            // Keep the legacy reward-dialog contract covered alongside the current Vue route.
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/math-course.html?chapter=math-8a-03&ui=legacy'");
            ready(s,"!!document.querySelector('#mark-read') && !!window.GrowingCourseAccount");
            js(s,"GrowingCourseAccount.open('settings')");
            ready(s,"!!window.UnitRewards && !!document.querySelector('#course-reset')");
            assertEquals("0",js(s,"document.querySelectorAll('iframe').length"));
            assertEquals("0",js(s,"document.querySelectorAll('.unit-reward-summary').length"));
            js(s,"UnitRewards.openCalendar('math-8a-03')");
            ready(s,"!!document.querySelector('dialog[open] [data-reward-tab=progress]')");
            js(s,"document.querySelector('dialog[open] [data-reward-tab=progress]').click()");
            ready(s,"!!document.querySelector('dialog[open] .unit-reward-summary')");
            assertEquals("200",js(s,"JSON.parse(localStorage.getItem('growing-unit-rewards-v1:math-8a-03')).config.cashYuan"));
            assertEquals("false",js(s,"Object.getOwnPropertyDescriptor(window,'localStorage').configurable"));
            js(s,"localStorage.setItem('course.route','native-bridge-ok')");
            assertEquals("\"native-bridge-ok\"",js(s,"localStorage.getItem('course.route')"));
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/knowledge.html?chapter=math-8b-09&mode=panorama&range=year'");
            ready(s,"!!document.querySelector('.student-knowledge.is-panorama svg')");
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=physics&term=upper&unit=physics-8a-01'");
            ready(s,"location.pathname.endsWith('/physics-course.html') && !!(window.GrowingCourseAI && document.querySelector('.course-tools-nav'))");
            assertEquals("true",js(s,"GrowingCourseAI.info().native"));
            js(s,"Array.from(document.querySelectorAll('.lesson-tabs button')).find(b=>b.textContent.trim()==='应用练习').click()");
            ready(s,"document.querySelectorAll('.application-round [data-question-id]').length===10");
            assertEquals("true",js(s,"!!document.querySelector('.application-round input[type=file]')"));
            assertEquals("true",js(s,"document.querySelector('.practice-submit button').disabled"));
            js(s,"document.querySelector('.application-round [role=radio]').click()");
            ready(s,"!document.querySelector('.practice-submit button').disabled");
            js(s,"document.querySelector('.practice-submit button').click()");
            ready(s,"!!document.querySelector('.round-score') && Array.from(document.querySelectorAll('.question-result')).some(e=>e.textContent.includes('未作答'))");
            assertEquals("\"native-bridge-ok\"",js(s,"localStorage.getItem('course.route')"));
            js(s,"location.href='https://appassets.androidplatform.net/assets/web/app-design/study.html?subject=english&term=upper&unit=english-8a-01'");
            ready(s,"location.pathname.endsWith('/english-course.html') && !!(window.GrowingCourseAI && document.querySelector('.word-card'))");
            assertEquals("true",js(s,"GrowingCourseAI.info().native"));
            assertEquals("0",js(s,"document.querySelectorAll('#word-detail,.tabs [data-view=settings]').length"));
            assertEquals("\"native-bridge-ok\"",js(s,"localStorage.getItem('course.route')"));
            js(s,"document.querySelector('.word-card-link').click()");
            ready(s,"!!document.querySelector('.student-english-panel h2[lang=en]')");
            js(s,"GrowingCourseAccount.open('settings')");
            ready(s,"!!document.querySelector('.student-course-settings input[readonly]')");
        }
    }
}
