package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.EditText;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Executed twice around adb install -r of a higher-version APK signed by the fixed key. */
@RunWith(AndroidJUnit4.class)
public class UpgradeTest {
    private static final String PASSWORD="test-Only-Password-1987";
    private Context context(){return ApplicationProvider.getApplicationContext();}
    private int version() throws Exception{return context().getPackageManager().getPackageInfo(context().getPackageName(),0).versionCode;}
    private WebView web(View view){if(view instanceof WebView)return (WebView)view;if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView result=web(group.getChildAt(i));if(result!=null)return result;}}return null;}
    private View find(View view,String label){
        if(label.equals(String.valueOf(view.getContentDescription())) || view instanceof Button && label.equals(((Button)view).getText().toString()))return view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){View found=find(group.getChildAt(i),label);if(found!=null)return found;}}
        return null;
    }
    private String js(ActivityScenario<MainActivity> scenario,String source) throws Exception{
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        scenario.onActivity(activity->{WebView view=web(activity.getWindow().getDecorView());if(view==null){result.set("missing-webview");latch.countDown();}else view.evaluateJavascript(source,value->{result.set(value);latch.countDown();});});
        assertTrue("WebView JavaScript callback timeout",latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void ready(ActivityScenario<MainActivity> scenario) throws Exception{
        for(int i=0;i<60;i++){if("true".equals(js(scenario,"document.readyState==='complete' && !!window.GrowingNative && !!document.querySelector('.subjects')")))return;Thread.sleep(200);}
        fail("Learning home or document-start bridge failed to load");
    }
    @Test public void seed() throws Exception{
        AccountStore accounts=new AccountStore(context());
        // Register through the real native form before testing the storage path.
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            scenario.onActivity(activity->{View decor=activity.getWindow().getDecorView();find(decor,"还没有账号？注册").performClick();});
            scenario.onActivity(activity->{View decor=activity.getWindow().getDecorView();((EditText)find(decor,"用户名")).setText("ui_student");((EditText)find(decor,"密码")).setText(PASSWORD);((EditText)find(decor,"确认密码")).setText(PASSWORD);find(decor,"注册并开始学习").performClick();});
            ready(scenario);
            assertEquals("ui_student",accounts.currentName());
        }
        accounts.logout();
        String alice=accounts.authenticate("upgrade_alice",PASSWORD.toCharArray(),true);
        assertNotNull(alice);assertEquals(alice,accounts.currentId());
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario);
            assertEquals("\"written\"",js(scenario,"localStorage.setItem('upgrade.english','alice-English');localStorage.setItem('upgrade.math','alice-Math');localStorage.setItem('upgrade.physics','alice-Physics');'written'"));
            assertEquals("\"reward-saved\"",js(scenario,"localStorage.setItem('growing-unit-rewards-v1:math-8b-10',JSON.stringify({version:1,config:{gameMinutes:120,cashYuan:200},peak:0.6,paidGame:72,paidCash:12000}));'reward-saved'"));
        }
        accounts.logout();
        accounts.authenticate("upgrade_bob",PASSWORD.toCharArray(),true);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario);assertEquals("null",js(scenario,"localStorage.getItem('upgrade.english')"));
            js(scenario,"localStorage.setItem('upgrade.english','bob-English')");
        }
        accounts.logout();
        try{accounts.authenticate("upgrade_alice","wrong-password".toCharArray(),false);fail("Incorrect password accepted");}catch(IllegalArgumentException expected){}
        assertEquals(alice,accounts.authenticate("upgrade_alice",PASSWORD.toCharArray(),false));
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario);assertEquals("\"alice-English\"",js(scenario,"localStorage.getItem('upgrade.english')"));
        }
        assertTrue(context().getSharedPreferences("upgrade-test",0).edit().putInt("old.version",version()).putString("alice.id",alice).commit());
    }
    @Test public void verify() throws Exception{
        int old=context().getSharedPreferences("upgrade-test",0).getInt("old.version",-1);
        assertTrue("Must run seed on an older APK first",old>0);
        assertTrue("APK version did not increase",version()>old);
        AccountStore accounts=new AccountStore(context());
        assertEquals("upgrade_alice",accounts.currentName());
        assertEquals(context().getSharedPreferences("upgrade-test",0).getString("alice.id",null),accounts.currentId());
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario);
            assertEquals("\"alice-English\"",js(scenario,"localStorage.getItem('upgrade.english')"));
            assertEquals("\"alice-Math\"",js(scenario,"localStorage.getItem('upgrade.math')"));
            assertEquals("\"alice-Physics\"",js(scenario,"localStorage.getItem('upgrade.physics')"));
            assertEquals("12000",js(scenario,"JSON.parse(localStorage.getItem('growing-unit-rewards-v1:math-8b-10')).paidCash"));
        }
        accounts.logout();accounts.authenticate("upgrade_bob",PASSWORD.toCharArray(),false);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            ready(scenario);assertEquals("\"bob-English\"",js(scenario,"localStorage.getItem('upgrade.english')"));
            assertEquals("null",js(scenario,"localStorage.getItem('upgrade.math')"));
            assertEquals("null",js(scenario,"localStorage.getItem('upgrade.physics')"));
            assertEquals("null",js(scenario,"localStorage.getItem('growing-unit-rewards-v1:math-8b-10')"));
        }
    }
}
