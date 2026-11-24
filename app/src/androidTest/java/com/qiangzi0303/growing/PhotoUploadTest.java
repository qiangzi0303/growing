package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import androidx.test.core.app.ActivityScenario;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Exercise the native chooser and its result callback from a direct course URL. */
@RunWith(AndroidJUnit4.class)
public class PhotoUploadTest {
    private WebView web(View view){
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView found=web(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    @Test public void courseCanSelectPhotoAndReceiveResult() throws Exception {
        android.content.Context context=ApplicationProvider.getApplicationContext();
        AccountStore accounts=new AccountStore(context);
        accounts.logout();accounts.authenticate("photo_upload_check","Photo-Test-Password-2026".toCharArray(),true);
        IdentityFixtures.student(accounts);
        File directory=new File(context.getCacheDir(),"paper-camera");assertTrue(directory.isDirectory()||directory.mkdirs());
        File photo=File.createTempFile("upload-test-",".jpg",directory);
        try(FileOutputStream output=new FileOutputStream(photo)){output.write(new byte[]{(byte)0xff,(byte)0xd8,(byte)0xff,(byte)0xd9});}
        Uri uri=FileProvider.getUriForFile(context,BuildConfig.APPLICATION_ID+".photos",photo);
        Instrumentation instrumentation=InstrumentationRegistry.getInstrumentation();
        Instrumentation.ActivityMonitor monitor=new Instrumentation.ActivityMonitor(){
            @Override public Instrumentation.ActivityResult onStartActivity(Intent intent){
                if(Intent.ACTION_CHOOSER.equals(intent.getAction()))return new Instrumentation.ActivityResult(Activity.RESULT_OK,new Intent().setData(uri));
                return null;
            }
        };
        instrumentation.addMonitor(monitor);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            IdentityFixtures.enterCache(scenario);
            String url="https://appassets.androidplatform.net/assets/web/app-design/index.html";
            boolean loaded=false;
            for(int i=0;i<100;i++){
                AtomicReference<String> current=new AtomicReference<>();
                scenario.onActivity(activity->current.set(web(activity.getWindow().getDecorView()).getUrl()));
                if(url.equals(current.get())){loaded=true;break;}Thread.sleep(100);
            }
            assertTrue("Direct packaged course must load",loaded);
            CountDownLatch done=new CountDownLatch(1);AtomicReference<Uri[]> result=new AtomicReference<>();
            scenario.onActivity(activity->{
                WebView view=web(activity.getWindow().getDecorView());
                WebChromeClient.FileChooserParams params=new WebChromeClient.FileChooserParams(){
                    public int getMode(){return MODE_OPEN;}
                    public String[] getAcceptTypes(){return new String[]{"image/jpeg","image/png","image/webp"};}
                    public boolean isCaptureEnabled(){return false;}
                    public CharSequence getTitle(){return "Upload answer";}
                    public String getFilenameHint(){return null;}
                    public Intent createIntent(){return new Intent(Intent.ACTION_GET_CONTENT).setType("image/*");}
                };
                assertTrue("Course upload must open the native chooser",view.getWebChromeClient().onShowFileChooser(view,values->{result.set(values);done.countDown();},params));
            });
            assertTrue("Selected photo must reach WebView callback",done.await(10,TimeUnit.SECONDS));
            assertArrayEquals(new Uri[]{uri},result.get());
        }finally{instrumentation.removeMonitor(monitor);photo.delete();}
    }
}
