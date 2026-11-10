package com.qiangzi0303.growing;

import android.app.Activity;
import android.app.AlertDialog;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.content.ClipData;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import java.io.File;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final String ORIGIN="https://appassets.androidplatform.net";
    private static final String HOME=ORIGIN+"/assets/web/app-design/index.html";
    private static final String CLOUD=ORIGIN+"/assets/web/cloud/index.html";
    private final ExecutorService executor=Executors.newSingleThreadExecutor();
    private AccountStore accounts;
    private LinearLayout root;
    private WebView web;
    private SpeechBridge speech;
    private volatile String currentId;
    private volatile long epoch=0;
    private boolean registering=false;
    private volatile boolean learningReady=false;
    private AppUpdater updater;
    private volatile String pendingRegistration;
    private static final int PHOTO_REQUEST=401;
    private ValueCallback<Uri[]> photoCallback;
    private File cameraFile;
    private Uri cameraUri;
    private String photoAccount;
    private long photoEpoch;
    private static final int MICROPHONE_REQUEST=402;
    private PermissionRequest microphoneRequest;
    private String microphoneAccount;
    private long microphoneEpoch;
    private boolean microphonePromptActive=false,foreground=false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        updater=new AppUpdater(this);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        accounts=new AccountStore(this);
        currentId=accounts.currentId();
        if(currentId==null) showLogin(); else showLearning();
    }
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private LinearLayout column(){LinearLayout result=new LinearLayout(this);result.setOrientation(LinearLayout.VERTICAL);return result;}
    private LinearLayout loginForm(){
        // Measure against the current window, including tablet split-screen widths.
        LinearLayout form=new LinearLayout(this){
            @Override protected void onMeasure(int widthSpec,int heightSpec){
                int width=Math.min(View.MeasureSpec.getSize(widthSpec),dp(560));
                super.onMeasure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),heightSpec);
            }
        };
        form.setOrientation(LinearLayout.VERTICAL);
        form.setGravity(Gravity.CENTER_VERTICAL);
        form.setPadding(dp(30),dp(35),dp(30),dp(35));
        return form;
    }
    private ScrollView scrollable(LinearLayout form){
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
        scroll.addView(form,new ScrollView.LayoutParams(-1,-2));return scroll;
    }
    private TextView text(String value,int size,int color){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);return t;}
    private Button button(String value){Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextSize(14);return b;}
    private void attachRoot(LinearLayout layout){
        root=layout;root.setBackgroundColor(Color.rgb(247,248,243));setContentView(root);
        root.setOnApplyWindowInsetsListener((view,insets)->{
            if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());view.setPadding(bars.left,bars.top,bars.right,bars.bottom);}
            else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        root.requestApplyInsets();
    }
    private EditText input(String hint,boolean password){EditText e=new EditText(this);e.setHint(hint);e.setSingleLine(true);e.setTextSize(16);e.setPadding(dp(12),dp(14),dp(12),dp(14));
        e.setInputType(password?InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD:InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        return e;}
    private void showLogin(){
        destroyWeb();
        LinearLayout outer=column();attachRoot(outer);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);outer.addView(scroll,new LinearLayout.LayoutParams(-1,-1));
        FrameLayout center=new FrameLayout(this);scroll.addView(center,new ScrollView.LayoutParams(-1,-2));
        LinearLayout form=loginForm();center.addView(form,new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER));
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.brand_logo);logo.setScaleType(ImageView.ScaleType.FIT_CENTER);logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);LinearLayout.LayoutParams logoParams=new LinearLayout.LayoutParams(dp(96),dp(96));logoParams.gravity=Gravity.CENTER_HORIZONTAL;form.addView(logo,logoParams);
        TextView title=text("逆流",34,Color.rgb(45,68,52));title.setTypeface(null,Typeface.BOLD);title.setGravity(Gravity.CENTER);title.setPadding(0,0,0,dp(24));form.addView(title);
        if(registering){TextView hint=text("创建你的学习账号",18,Color.rgb(80,110,70));hint.setPadding(0,dp(12),0,dp(24));form.addView(hint);}
        EditText name=input("用户名",false);name.setContentDescription("用户名");form.addView(name);
        EditText password=input("密码",true);password.setContentDescription("密码");form.addView(password);
        EditText confirm=input("再次输入密码",true);confirm.setContentDescription("确认密码");if(registering)form.addView(confirm);
        RadioGroup roles=new RadioGroup(this);roles.setContentDescription("账号身份");
        RadioButton student=new RadioButton(this);student.setId(View.generateViewId());student.setText("我是学生");roles.addView(student);
        RadioButton parent=new RadioButton(this);parent.setId(View.generateViewId());parent.setText("我是家长");roles.addView(parent);
        CheckBox consent=new CheckBox(this);consent.setText("同意联网注册并将身份保存到后台；学生学习记录将同步，AI 密钥不上传。");consent.setContentDescription("同意云账号注册");
        if(registering){form.addView(text("请选择身份（必选）",16,Color.rgb(80,110,70)));form.addView(roles);form.addView(consent);}
        TextView error=text("",14,Color.rgb(160,90,60));error.setPadding(0,dp(12),0,dp(8));form.addView(error);
        Button submit=button(registering?"注册并保存身份":"登录");form.addView(submit);
        Button toggle=button(registering?"已有账号？去登录":"还没有账号？注册");form.addView(toggle);
        toggle.setOnClickListener(v->{registering=!registering;showLogin();});
        submit.setOnClickListener(v->{
            if(registering&&roles.getCheckedRadioButtonId()==-1){error.setText("请选择学生或家长身份。");return;}
            if(registering&&!consent.isChecked()){error.setText("请先同意联网注册并保存身份。");return;}
            String username=name.getText().toString();char[] secret=password.getText().toString().toCharArray();
            if(registering && !Arrays.equals(secret,confirm.getText().toString().toCharArray())){Arrays.fill(secret,'\0');error.setText("两次输入的密码不一致。");return;}
            boolean register=registering;String role=roles.getCheckedRadioButtonId()==student.getId()?"Student":"Parent";
            submit.setEnabled(false);toggle.setEnabled(false);error.setText("正在验证，请稍候…");
            executor.execute(()->{
                try{String id;
                    id=accounts.loginCloud(username,secret,new CloudAuthClient(BuildConfig.CLOUD_API_URL).authenticate(username,secret,register,role));
                    final String loggedIn=id;
                    runOnUiThread(()->{if(isFinishing()||isDestroyed())return;pendingRegistration=null;currentId=loggedIn;epoch++;showLearning();});}
                catch(Exception e){String message=e instanceof java.io.IOException?"无法连接云服务，请检查网络后重试。":e.getMessage();runOnUiThread(()->{if(isFinishing()||isDestroyed())return;error.setText(message==null?"操作未完成，请重试。":message);submit.setEnabled(true);toggle.setEnabled(true);});}
                finally{Arrays.fill(secret,'\0');}
            });
        });
    }
    private void showLearning(){
        learningReady=false;
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)){
            new AlertDialog.Builder(this).setTitle("请更新系统 WebView").setMessage("当前 Android System WebView 版本较旧。请在应用商店更新后重新打开逆流，以确保账号记录隔离。").setPositiveButton("关闭",(d,w)->finish()).setCancelable(false).show();return;
        }
        destroyWeb();
        LinearLayout outer=column();attachRoot(outer);
        web=new WebView(this);outer.addView(web,new LinearLayout.LayoutParams(-1,0,1));
        web.setBackgroundColor(Color.rgb(247,248,243));
        web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(true);
        web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // Voice starts from the explicit microphone control; async WebRTC RTP must keep playing.
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.getSettings().setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){runOnUiThread(()->requestMicrophone(request));}
            @Override public void onPermissionRequestCanceled(PermissionRequest request){runOnUiThread(()->{if(microphoneRequest==request)microphoneRequest=null;});}
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(view.getUrl()==null||!view.getUrl().startsWith(ORIGIN+"/assets/web/cloud/"))return false;
                cancelPhoto();
                photoCallback=callback;photoAccount=currentId;photoEpoch=epoch;
                try{
                    Intent album=new Intent(Intent.ACTION_GET_CONTENT);album.setType("image/*");album.addCategory(Intent.CATEGORY_OPENABLE);
                    album.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/jpeg","image/png","image/webp"});
                    album.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                    Intent camera=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    if(camera.resolveActivity(getPackageManager())!=null){
                        File directory=new File(getCacheDir(),"paper-camera");if(!directory.exists()&&!directory.mkdirs())throw new java.io.IOException();
                        cameraFile=File.createTempFile("paper-",".jpg",directory);
                        cameraUri=FileProvider.getUriForFile(MainActivity.this,BuildConfig.APPLICATION_ID+".photos",cameraFile);
                        camera.putExtra(MediaStore.EXTRA_OUTPUT,cameraUri);
                        camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        camera.setClipData(ClipData.newRawUri("试卷照片",cameraUri));
                        if(params.isCaptureEnabled()){startActivityForResult(camera,PHOTO_REQUEST);return true;}
                        Intent chooser=Intent.createChooser(album,"选择试卷照片");chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,new Intent[]{camera});
                        startActivityForResult(chooser,PHOTO_REQUEST);
                    }else startActivityForResult(Intent.createChooser(album,"选择试卷照片"),PHOTO_REQUEST);
                }catch(Exception e){cancelPhoto();Toast.makeText(MainActivity.this,"无法打开相机或相册，请检查是否已安装相机应用。",Toast.LENGTH_LONG).show();}
                return true;
            }
        });
        web.addJavascriptInterface(new LearningBridge(this,currentId,epoch),"GrowingNative");
        speech=new SpeechBridge(this,web,currentId,epoch);
        web.addJavascriptInterface(speech,"GrowingSpeech");
        try{
            java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
            for(String asset:new String[]{"speech-bootstrap.js","bootstrap.js","web/cloud/sync-core.js","web/cloud/cloud-agent.js"}){
                try(InputStream stream=getAssets().open(asset)){
                    byte[] buffer=new byte[8192];int count;while((count=stream.read(buffer))!=-1)bytes.write(buffer,0,count);
                    bytes.write('\n');
                }
            }
            String script=bytes.toString(StandardCharsets.UTF_8.name());
            WebViewCompat.addDocumentStartJavaScript(web,script,Collections.singleton(ORIGIN));
        }catch(Exception e){new AlertDialog.Builder(this).setMessage("学习环境未能初始化，请重新安装同签名的安装包。").setPositiveButton("关闭",(d,w)->finish()).show();return;}
        WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){cancelMicrophone();if(speech!=null)speech.cancel();}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){return loader.shouldInterceptRequest(request.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl();
                NativeIdentity identity=accounts.identity(currentId);
                if(request.isForMainFrame()&&ORIGIN.equals(url.getScheme()+"://"+url.getHost())&&url.getPath()!=null&&url.getPath().startsWith("/assets/web/")
                        &&!url.getPath().startsWith("/assets/web/cloud/")&&(!learningReady||identity==null||identity.role.equals("Parent"))){view.loadUrl(CLOUD);return true;}
                if("https".equals(url.getScheme())&&"appassets.androidplatform.net".equals(url.getHost())&&url.getPath()!=null&&url.getPath().startsWith("/assets/web/"))return false;
                if(request.isForMainFrame()&&"https".equals(url.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,url));}catch(Exception ignored){}}
                return true;
            }
        });
        loadHome();
    }
    public void loadHome(){if(web!=null){learningReady=false;web.loadUrl(CLOUD);}}
    void openLearning(String id,long value){
        if(!isSession(id,value))throw new SecurityException("登录已失效。");
        NativeIdentity identity=accounts.identity(id);
        if(identity==null||identity.role.equals("Parent"))throw new SecurityException("请先确认学生身份。");
        runOnUiThread(()->{if(isSession(id,value)&&web!=null){learningReady=true;web.loadUrl(HOME);}});
    }
    private void navigateBack(){
        if(web==null)return;
        NativeIdentity identity=accounts.identity(currentId);
        if(CLOUD.equals(web.getUrl())&&(identity==null||!identity.role.equals("Student"))){
            try{accounts.logout();currentId=null;pendingRegistration=null;epoch++;registering=false;showLogin();}
            catch(Exception e){new AlertDialog.Builder(this).setMessage("未能返回登录，请重试。").setPositiveButton("好",null).show();}
        }else loadHome();
    }
    synchronized String takeRegistration(String id,long value){
        if(!isSession(id,value))return "";
        String result=pendingRegistration;pendingRegistration=null;return result==null?"":result;
    }
    String identityAccount(String id,long value){NativeIdentity identity=isSession(id,value)?accounts.identity(id):null;return identity==null?"":identity.id;}
    boolean confirmCloudSession(String id,long value,String session) throws Exception {
        if(!isSession(id,value))throw new SecurityException("登录已失效，请重新登录。");
        String selected=accounts.confirmCloudSession(id,session);
        boolean switched=!id.equals(selected);
        runOnUiThread(()->{if(isSession(id,value)&&web!=null){
            if(switched){currentId=selected;epoch++;showLearning();}
        }});
        return switched;
    }
    void confirmIdentity(String id,long value,String profile) throws Exception {
        if(!isSession(id,value))throw new SecurityException("登录已失效。");
        accounts.confirmIdentity(id,profile);
    }
    public boolean isSession(String id,long value){return id!=null&&id.equals(currentId)&&value==epoch;}
    public void openAiSettings(){
        if(currentId!=null&&web!=null)web.evaluateJavascript("window.GrowingApiSettings&&window.GrowingApiSettings.open('deepseek')",null);
    }
    public void showDeviceSettings(){
        if(currentId==null)return;
        LinearLayout form=column();form.setPadding(dp(24),dp(8),dp(24),0);
        form.addView(text("版本："+BuildConfig.VERSION_NAME+"\n课程和内置练习支持离线使用，英语朗读需安装系统语音数据。",14,Color.rgb(80,100,75)));
        Button voice=button("朗读设置 / 英语试读");voice.setOnClickListener(v->showSpeechSettings());form.addView(voice);
        Button updates=button("检查更新");updates.setOnClickListener(v->updater.check(true));form.addView(updates);
        new AlertDialog.Builder(this).setTitle("设备设置").setView(scrollable(form)).setPositiveButton("关闭",null).show();
    }
    public void logoutAccount(){
        try{accounts.logout();currentId=null;pendingRegistration=null;epoch++;showLogin();}
        catch(Exception e){new AlertDialog.Builder(this).setMessage("未能退出账号，请重试。").setPositiveButton("好",null).show();}
    }
    private void openSpeechSettings(boolean install){
        try{startActivity(new Intent(install?TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA:"com.android.settings.TTS_SETTINGS"));}
        catch(Exception e){
            Toast.makeText(this,"请在系统设置中搜索“文字转语音”，安装或启用语音引擎，并下载英语语音数据。",Toast.LENGTH_LONG).show();
            try{startActivity(new Intent(Settings.ACTION_SETTINGS));}catch(Exception ignored){}
        }
    }
    private void showSpeechSettings(){
        LinearLayout form=column();form.setPadding(dp(24),dp(8),dp(24),0);
        form.addView(text("朗读使用 Android 系统语音服务。请先选择可用引擎，并下载英语语音数据（数学设备朗读另需中文）。\n\n试读时调高媒体音量；若引擎仅支持在线语音，还需要联网。下载语言包后建议重新打开逆流。",14,Color.rgb(80,100,75)));
        Button test=button("试读英语：Hello, welcome to Growing");
        test.setOnClickListener(v->{if(web!=null)web.evaluateJavascript("speechSynthesis.cancel();var t=new SpeechSynthesisUtterance('Hello, welcome to Growing.');t.lang='en-GB';speechSynthesis.speak(t);",null);});form.addView(test);
        new AlertDialog.Builder(this).setTitle("朗读设置").setView(scrollable(form))
            .setPositiveButton("系统语音设置",(d,w)->openSpeechSettings(false))
            .setNeutralButton("安装语音数据",(d,w)->openSpeechSettings(true))
            .setNegativeButton("关闭",null).show();
    }
    private void cancelPhoto(){
        if(photoCallback!=null){photoCallback.onReceiveValue(null);photoCallback=null;}
        if(cameraFile!=null){cameraFile.delete();cameraFile=null;}cameraUri=null;
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=PHOTO_REQUEST||photoCallback==null)return;
        ValueCallback<Uri[]> callback=photoCallback;photoCallback=null;
        Uri[] values=null;
        if(result==RESULT_OK&&isSession(photoAccount,photoEpoch)){
            if(data!=null&&data.getClipData()!=null){
                ClipData clips=data.getClipData();int count=clips.getItemCount();
                if(count>4)Toast.makeText(this,"每批最多选择 4 页试卷，请分批录入。",Toast.LENGTH_LONG).show();
                else{values=new Uri[count];for(int i=0;i<count;i++)values[i]=clips.getItemAt(i).getUri();}
            }else if(data!=null&&data.getData()!=null)values=new Uri[]{data.getData()};
            else if(cameraUri!=null&&cameraFile!=null&&cameraFile.length()>0)values=new Uri[]{cameraUri};
        }
        callback.onReceiveValue(values);
    }
    private void requestMicrophone(PermissionRequest request){
        android.util.Log.i("GrowingMicrophone","request: foreground="+foreground+", account="+(currentId!=null)+", pending="+(microphoneRequest!=null)+", prompt="+microphonePromptActive+", trusted="+(web!=null&&MicrophonePolicy.permits(request.getOrigin().toString(),web.getUrl(),request.getResources())));
        if(!foreground||currentId==null||web==null||microphoneRequest!=null||microphonePromptActive||!MicrophonePolicy.permits(request.getOrigin().toString(),web.getUrl(),request.getResources())){request.deny();return;}
        microphoneRequest=request;microphoneAccount=currentId;microphoneEpoch=epoch;
        if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)completeMicrophone(true);
        else{microphonePromptActive=true;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MICROPHONE_REQUEST);}
    }
    private void completeMicrophone(boolean allowed){
        android.util.Log.i("GrowingMicrophone","complete: allowed="+allowed+", foreground="+foreground+", pending="+(microphoneRequest!=null));
        PermissionRequest request=microphoneRequest;microphoneRequest=null;
        if(request==null)return;
        if(allowed&&foreground&&isSession(microphoneAccount,microphoneEpoch)&&web!=null&&MicrophonePolicy.permits(request.getOrigin().toString(),web.getUrl(),request.getResources()))request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        else request.deny();
    }
    private void cancelMicrophone(){if(microphoneRequest!=null){android.util.Log.i("GrowingMicrophone","cancel pending: prompt="+microphonePromptActive+", foreground="+foreground);microphoneRequest.deny();microphoneRequest=null;}}
    private void stopRealtime(){
        if(web!=null)web.evaluateJavascript("(function stop(w){try{w.dispatchEvent(new w.Event('growing-realtime-stop'));for(var i=0;i<w.frames.length;i++)stop(w.frames[i]);}catch(e){}})(window);",null);
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){
        super.onRequestPermissionsResult(request,permissions,grants);
        if(request==MICROPHONE_REQUEST){
            android.util.Log.i("GrowingMicrophone","runtime result: grants="+java.util.Arrays.toString(grants));
            microphonePromptActive=false;
            boolean allowed=grants.length==1&&grants[0]==PackageManager.PERMISSION_GRANTED;
            // Android may deliver the result before onResume after its permission dialog.
            if(!allowed||foreground)completeMicrophone(allowed);
        }
    }
    private void destroyWeb(){
        cancelMicrophone();stopRealtime();
        cancelPhoto();
        if(speech!=null){speech.close();speech=null;}
        if(web!=null){web.stopLoading();web.removeJavascriptInterface("GrowingNative");web.removeJavascriptInterface("GrowingSpeech");web.destroy();web=null;}
    }
    @Override public void onBackPressed(){if(web!=null&&!HOME.equals(web.getUrl()))navigateBack();else super.onBackPressed();}
    @Override protected void onPause(){
        foreground=false;
        // Keep a first-use request pending while Android shows its own permission dialog.
        // A real background transition is cancelled in onStop below.
        if(!microphonePromptActive){cancelMicrophone();stopRealtime();if(web!=null)web.onPause();}
        if(speech!=null)speech.interrupt();
        if(web!=null)web.evaluateJavascript("if(window.GrowingCloudFlush)window.GrowingCloudFlush();",null);
        super.onPause();
    }
    @Override protected void onResume(){
        super.onResume();foreground=true;if(web!=null)web.onResume();
        if(microphoneRequest!=null&&!microphonePromptActive)completeMicrophone(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED);
    }
    @Override protected void onStart(){super.onStart();updater.onStart();}
    @Override protected void onStop(){cancelMicrophone();stopRealtime();if(web!=null)web.onPause();updater.onStop();super.onStop();}
    @Override protected void onDestroy(){pendingRegistration=null;if(updater!=null)updater.close();destroyWeb();executor.shutdown();super.onDestroy();}
}
