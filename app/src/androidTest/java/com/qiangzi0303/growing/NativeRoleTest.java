package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.webkit.WebViewCompat;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Real native form, WebView assets and JavascriptInterface; only HTTP responses are simulated. */
@RunWith(AndroidJUnit4.class)
public class NativeRoleTest {
    private AccountStore accounts(){return new AccountStore(ApplicationProvider.getApplicationContext());}
    private View find(View view,String label){
        if(label.equals(String.valueOf(view.getContentDescription())) || view instanceof android.widget.TextView && label.equals(((android.widget.TextView)view).getText().toString()))return view;
        if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++){View found=find(g.getChildAt(i),label);if(found!=null)return found;}}
        return null;
    }
    private WebView web(View view){if(view instanceof WebView)return (WebView)view;if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++){WebView w=web(g.getChildAt(i));if(w!=null)return w;}}return null;}
    private String js(ActivityScenario<MainActivity> s,String source) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        s.onActivity(a->web(a.getWindow().getDecorView()).evaluateJavascript(source,v->{result.set(v);latch.countDown();}));
        assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void ready(ActivityScenario<MainActivity> s,String condition) throws Exception {
        for(int i=0;i<100;i++){if("true".equals(js(s,condition)))return;Thread.sleep(100);}
        fail("Native identity UI did not reach: "+condition+"; state="+js(s,"JSON.stringify({url:location.href,documentId:window.qaDocumentId,calls:window.qaCalls,message:document.querySelector('#message')?.textContent,role:document.querySelector('#choose-role select')?.value,body:document.body.innerText.slice(0,1000)})"));
    }
    private void mockCloud(ActivityScenario<MainActivity> s){
        String script="(()=>{window.qaDocumentId=Math.random();const original=fetch.bind(window);let p=JSON.parse(localStorage.getItem('growing-cloud-session-v1')||'null')?.user||{id:'00000000-0000-4000-8000-000000000001',username:'qa',displayName:'QA',role:'Student',roleSelectionRequired:true};window.qaFail=false;window.qaCalls=[];window.fetch=async(input,init={})=>{const u=new URL(String(input),location.href);if(!u.pathname.startsWith('/api/'))return original(input,init);const path=u.pathname.slice(4);qaCalls.push(path);let code=200,data={};if(path==='/auth/me'){if(localStorage.getItem('growing-cloud-session-v1'))data=p;else{code=401;data={error:'请登录'};}}else if(path==='/auth/login')data={token:'qa-only-token',user:p};else if(path==='/auth/role'){if(qaFail){code=503;data={error:'保存失败，请重试'};}else{p={...p,role:JSON.parse(init.body).role,roleSelectionRequired:false};data=p;}}else if(['/student/state','/student/parents','/parent/children'].includes(path))data=[];else if(path==='/student/rankings')data={boards:[]};return new Response(JSON.stringify(data),{status:code,headers:{'Content-Type':'application/json'}});};})();";
        s.onActivity(a->{WebView w=web(a.getWindow().getDecorView());WebViewCompat.addDocumentStartJavaScript(w,script,Collections.singleton("https://appassets.androidplatform.net"));w.reload();});
    }
    @Test public void nativeRegistrationRequiresAnExplicitRoleAndCloudConsent() throws Exception {
        AccountStore accounts=accounts();accounts.logout();
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            s.onActivity(a->{View v=a.getWindow().getDecorView();find(v,"还没有账号？注册").performClick();});
            s.onActivity(a->{View v=a.getWindow().getDecorView();
                assertFalse(((RadioButton)find(v,"我是学生")).isChecked());assertFalse(((RadioButton)find(v,"我是家长")).isChecked());
                ((EditText)find(v,"用户名")).setText("qa_native_"+Long.toString(System.nanoTime(),36));((EditText)find(v,"密码")).setText("Native-Test-Password");((EditText)find(v,"确认密码")).setText("Native-Test-Password");
                find(v,"注册并保存身份").performClick();assertNotNull(find(v,"请选择学生或家长身份。"));
                find(v,"我是家长").performClick();find(v,"注册并保存身份").performClick();assertNotNull(find(v,"请先同意联网注册并保存身份。"));
            });
            assertNull(accounts.currentId());
        }
    }
    private void confirmLegacy(String role) throws Exception {
        AccountStore accounts=accounts();accounts.logout();String id=accounts.authenticate("legacy_"+Long.toString(System.nanoTime(),36),"Native-Test-Password".toCharArray(),true);
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            mockCloud(s);ready(s,"typeof window.qaDocumentId==='number' && !!document.querySelector('#auth')");
            assertNull(accounts.identity(id));
            String before=js(s,"window.qaDocumentId");
            js(s,"location.href='../app-design/index.html'");ready(s,"window.qaDocumentId!=="+before+" && location.pathname.endsWith('/cloud/index.html') && !!document.querySelector('#auth')");
            js(s,"document.querySelector('[name=username]').value='qa';document.querySelector('[name=password]').value='Native-Test-Password';document.querySelector('[name=consent]').checked=true;document.querySelector('#auth').requestSubmit()");
            ready(s,"!!document.querySelector('#choose-role')");
            assertEquals("true",js(s,"!qaCalls.some(p=>p.startsWith('/student/')||p.startsWith('/parent/'))"));
            js(s,"document.querySelector('#choose-role select').value='"+role+"';qaFail=true;document.querySelector('#choose-role').requestSubmit()");
            ready(s,"document.querySelector('#message').textContent.includes('保存失败')");assertNull(accounts.identity(id));
            js(s,"qaFail=false;document.querySelector('#choose-role').requestSubmit()");
            ready(s,role.equals("Parent")?"!!document.querySelector('#children')":"!!document.querySelector('.subjects')");
            assertEquals(role,accounts.identity(id).role);
            before=js(s,"window.qaDocumentId");s.onActivity(MainActivity::loadHome);
            ready(s,"window.qaDocumentId!=="+before+" && "+(role.equals("Parent")?"!!document.querySelector('#children')":"!!document.querySelector('.subjects')"));
            if(role.equals("Parent")){before=js(s,"window.qaDocumentId");js(s,"location.href='../app-design/index.html'");ready(s,"window.qaDocumentId!=="+before+" && location.pathname.endsWith('/cloud/index.html') && !!document.querySelector('#children')");}
        }
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            mockCloud(s);
            ready(s,role.equals("Parent")?"!!document.querySelector('#children')":"!!document.querySelector('.subjects')");
            assertEquals(role,accounts.identity(id).role);
        }
    }
    @Test public void legacyStudentCannotBypassGateAndConfirmationSurvivesRestart() throws Exception {confirmLegacy("Student");}
    @Test public void legacyParentSavesBeforeEntryAndNeverEntersStudentCourses() throws Exception {confirmLegacy("Parent");}
    @Test public void unconfirmedLegacyAccountCanReturnToLoginWithoutLosingRecords() throws Exception {
        AccountStore accounts=accounts();accounts.logout();String name="return_"+Long.toString(System.nanoTime(),36);
        String id=accounts.authenticate(name,"Native-Test-Password".toCharArray(),true);
        android.content.SharedPreferences records=ApplicationProvider.getApplicationContext().getSharedPreferences("learning-v1-"+id,0);
        assertTrue(records.edit().putString("qa-preserved","original-progress").commit());
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            ready(s,"!!document.querySelector('#auth')");
            s.onActivity(a->{View button=find(a.getWindow().getDecorView(),"‹ 返回登录");assertNotNull(button);assertEquals(View.VISIBLE,button.getVisibility());button.performClick();});
            assertNull(accounts.currentId());assertNull(accounts.identity(id));
            assertEquals("original-progress",records.getString("qa-preserved",""));
            s.onActivity(a->{View v=a.getWindow().getDecorView();assertNotNull(find(v,"登录"));});
        }
        assertEquals(id,accounts.authenticate(name,"Native-Test-Password".toCharArray(),false));
    }
    @Test public void confirmedStudentRestoresBeforeEnteringHome() throws Exception {
        AccountStore accounts=accounts();accounts.logout();accounts.authenticate("home_"+Long.toString(System.nanoTime(),36),"Native-Test-Password".toCharArray(),true);IdentityFixtures.student(accounts);
        try(ActivityScenario<MainActivity> s=ActivityScenario.launch(MainActivity.class)){
            ready(s,"!!document.querySelector('#auth')");
            assertEquals("true",js(s,"location.pathname.endsWith('/cloud/index.html')"));
            IdentityFixtures.enterCache(s);
            ready(s,"!!document.querySelector('.subjects')");
            js(s,"location.href='../cloud/index.html'");ready(s,"!!document.querySelector('#auth')");
            s.onActivity(a->{View button=find(a.getWindow().getDecorView(),"‹ 返回主页");assertNotNull(button);assertEquals(View.VISIBLE,button.getVisibility());button.performClick();});
            ready(s,"!!document.querySelector('#auth')");
            assertEquals("Student",accounts.identity(accounts.currentId()).role);
        }
    }
}
