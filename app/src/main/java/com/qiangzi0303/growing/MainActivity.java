package com.qiangzi0303.growing;

import android.app.Activity;
import android.app.AlertDialog;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.content.SharedPreferences;
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
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.AdapterView;
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
    private Button back;
    private TextView screenTitle;
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
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.brand_logo);logo.setScaleType(ImageView.ScaleType.FIT_CENTER);logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);form.addView(logo,new LinearLayout.LayoutParams(dp(96),dp(96)));
        TextView title=text("逆流",34,Color.rgb(45,68,52));title.setTypeface(null,Typeface.BOLD);form.addView(title);
        TextView hint=text(registering?"创建你的学习账号":"登录，继续你的学习",18,Color.rgb(80,110,70));hint.setPadding(0,dp(12),0,dp(24));form.addView(hint);
        EditText name=input("用户名（2—24 个字符）",false);name.setContentDescription("用户名");form.addView(name);
        EditText password=input("密码（至少 8 个字符）",true);password.setContentDescription("密码");form.addView(password);
        EditText confirm=input("再次输入密码",true);confirm.setContentDescription("确认密码");if(registering)form.addView(confirm);
        CheckBox legacy=new CheckBox(this);legacy.setText("旧本机账号迁移 / 断网使用已有缓存");if(!registering)form.addView(legacy);
        RadioGroup roles=new RadioGroup(this);roles.setContentDescription("账号身份");
        RadioButton student=new RadioButton(this);student.setId(View.generateViewId());student.setText("我是学生");roles.addView(student);
        RadioButton parent=new RadioButton(this);parent.setId(View.generateViewId());parent.setText("我是家长");roles.addView(parent);
        CheckBox consent=new CheckBox(this);consent.setText("同意联网注册并将身份保存到后台；学生学习记录将同步，AI 密钥不上传。");consent.setContentDescription("同意云账号注册");
        if(registering){form.addView(text("请选择身份（必选）",16,Color.rgb(80,110,70)));form.addView(roles);form.addView(consent);}
        TextView error=text("",14,Color.rgb(160,90,60));error.setPadding(0,dp(12),0,dp(8));form.addView(error);
        Button submit=button(registering?"注册并保存身份":"登录");form.addView(submit);
        Button toggle=button(registering?"已有账号？去登录":"还没有账号？注册");form.addView(toggle);
        Button updates=button("检查更新 · "+BuildConfig.VERSION_NAME);updates.setOnClickListener(v->updater.check(true));form.addView(updates);
        TextView note=text("使用同一云账号登录，可在新设备恢复已保存的学习记录，无需重新注册。旧本机账号请勾选迁移后登录并关联云账号。\n课程记录自动保存到云端；断网缓存将在联网后补传。清除设备数据前，请确认云端保存成功。",12,Color.rgb(125,136,118));note.setPadding(0,dp(22),0,0);note.setLineSpacing(dp(3),1);form.addView(note);
        toggle.setOnClickListener(v->{registering=!registering;showLogin();});
        submit.setOnClickListener(v->{
            if(registering&&roles.getCheckedRadioButtonId()==-1){error.setText("请选择学生或家长身份。");return;}
            if(registering&&!consent.isChecked()){error.setText("请先同意联网注册并保存身份。");return;}
            String username=name.getText().toString();char[] secret=password.getText().toString().toCharArray();
            if(registering && !Arrays.equals(secret,confirm.getText().toString().toCharArray())){Arrays.fill(secret,'\0');error.setText("两次输入的密码不一致。");return;}
            boolean register=registering;String role=roles.getCheckedRadioButtonId()==student.getId()?"Student":"Parent";
            boolean localLogin=!register&&legacy.isChecked();
            submit.setEnabled(false);toggle.setEnabled(false);error.setText("正在验证，请稍候…");
            executor.execute(()->{
                try{String id;
                    if(localLogin)id=accounts.authenticate(username,secret,false);
                    else id=accounts.loginCloud(username,secret,new CloudAuthClient(BuildConfig.CLOUD_API_URL).authenticate(username,secret,register,role));
                    final String loggedIn=id;
                    runOnUiThread(()->{if(isFinishing()||isDestroyed())return;pendingRegistration=null;currentId=loggedIn;epoch++;showLearning();});}
                catch(Exception e){String message=e instanceof java.io.IOException?"无法连接云服务，请检查网络。已有缓存可选择「旧本机账号迁移 / 断网使用已有缓存」。":e.getMessage();runOnUiThread(()->{if(isFinishing()||isDestroyed())return;error.setText(message==null?"操作未完成，请重试。":message);submit.setEnabled(true);toggle.setEnabled(true);});}
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
        LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);toolbar.setPadding(dp(8),0,dp(8),0);
        back=button("‹ 返回登录");back.setOnClickListener(v->navigateBack());toolbar.addView(back);
        screenTitle=text("",14,Color.rgb(80,110,70));screenTitle.setGravity(Gravity.CENTER);toolbar.addView(screenTitle,new LinearLayout.LayoutParams(0,dp(48),1));
        Button account=button("账号");account.setOnClickListener(v->showAccount());toolbar.addView(account);outer.addView(toolbar,new LinearLayout.LayoutParams(-1,dp(48)));
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
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){cancelMicrophone();if(speech!=null)speech.cancel();updateNavigation(url);}
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
            @Override public void onPageFinished(WebView view,String url){updateNavigation(url);}
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
    private void updateNavigation(String url){
        boolean home=HOME.equals(url),cloud=CLOUD.equals(url);
        NativeIdentity identity=accounts.identity(currentId);
        back.setVisibility(home?View.INVISIBLE:View.VISIBLE);
        back.setText(cloud?(identity!=null&&identity.role.equals("Student")?"‹ 返回主页":"‹ 返回登录"):"‹ 返回选科");
        screenTitle.setText(cloud?"云账号与身份":home?"":url.contains("word-ops")?"英语 · Unit 3":url.contains("fraction-ops")?"数学 · 分式":url.contains("subject=english")||url.contains("english-course")?"英语":url.contains("subject=physics")||url.contains("physics-")?"物理":url.contains("math-course")||url.contains("knowledge")||url.contains("subject=math")?"数学":"逆流课堂");
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
    void confirmIdentity(String id,long value,String profile) throws Exception {
        if(!isSession(id,value))throw new SecurityException("登录已失效。");
        accounts.confirmIdentity(id,profile);
        runOnUiThread(()->{if(isSession(id,value)&&web!=null)updateNavigation(web.getUrl());});
    }
    public boolean isSession(String id,long value){return id!=null&&id.equals(currentId)&&value==epoch;}
    public void showAccount(){
        if(currentId==null)return;
        final String settingsAccount=currentId;final long settingsEpoch=epoch;
        SharedPreferences settings=getSharedPreferences("settings-v1-"+currentId,MODE_PRIVATE);
        LinearLayout form=column();form.setPadding(dp(24),dp(8),dp(24),0);
        NativeIdentity identity=accounts.identity(currentId);
        TextView note=text("本机账号："+accounts.currentName()+"\n身份："+(identity==null?"待确认":identity.role.equals("Student")?"学生":identity.role.equals("Parent")?"家长":"管理员")+"\n版本："+BuildConfig.VERSION_NAME+"\n\n学生课程、内置音频和练习可离线使用。单词朗读使用手机语音引擎，离线使用需先安装英语语音数据。AI 评分和答疑需要联网并配置自己的 DeepSeek API Key。密钥只保存在此账号的本机设置中。",14,Color.rgb(80,100,75));form.addView(note);
        Button voice=button("朗读设置 / 英语试读");voice.setOnClickListener(v->showSpeechSettings());form.addView(voice);
        Button updates=button("检查更新");updates.setOnClickListener(v->updater.check(true));form.addView(updates);
        Button cloud=button(identity!=null&&identity.role.equals("Parent")?"我的孩子":"云同步");form.addView(cloud);
        EditText key=input(settings.getString("ai.key","").isEmpty()?"填写 DeepSeek API Key":"已配置，留空保持现有密钥",true);form.addView(key);
        form.addView(text("小鸭实时语音 · qwen3.8-omni-flash-realtime",16,Color.rgb(45,68,52)));
        EditText realtimeKey=input(settings.getString("realtime.key","").isEmpty()?"填写 Qwen API Key":"Qwen 已配置，留空沿用",true);realtimeKey.setContentDescription("Qwen API Key");form.addView(realtimeKey);
        form.addView(text("音色",14,Color.rgb(80,100,75)));
        String[] voiceOptions=Arrays.copyOf(RealtimeSettings.VOICES,RealtimeSettings.VOICES.length+1);voiceOptions[voiceOptions.length-1]="其他音色（填写 ID）";
        Spinner realtimeVoice=new Spinner(this);realtimeVoice.setContentDescription("Qwen 音色");
        ArrayAdapter<String> voiceAdapter=new ArrayAdapter<>(this,android.R.layout.simple_spinner_item,voiceOptions);voiceAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);realtimeVoice.setAdapter(voiceAdapter);form.addView(realtimeVoice);
        String savedVoice=settings.getString("realtime.voice","Tina");int selectedVoice=Arrays.asList(RealtimeSettings.VOICES).indexOf(savedVoice);realtimeVoice.setSelection(selectedVoice<0?voiceOptions.length-1:selectedVoice);
        EditText customVoice=input("服务商支持的音色 ID",false);customVoice.setText(selectedVoice<0?savedVoice:"");customVoice.setContentDescription("Qwen 自定义音色 ID");form.addView(customVoice);
        customVoice.setVisibility(selectedVoice<0?View.VISIBLE:View.GONE);
        realtimeVoice.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener(){
            public void onItemSelected(AdapterView<?> parent,View view,int position,long id){customVoice.setVisibility(position==voiceOptions.length-1?View.VISIBLE:View.GONE);}
            public void onNothingSelected(AdapterView<?> parent){}
        });
        EditText realtimeBase=input("百炼服务地址",false);realtimeBase.setText(settings.getString("realtime.base",RealtimeSettings.DEFAULT_BASE));realtimeBase.setContentDescription("百炼服务地址");form.addView(realtimeBase);
        form.addView(text("业务空间密钥需填写对应的百炼接口地址。实时语音密钥按本机账号保存，连接时经语音代理转发，不随学习记录同步。开启语音时才申请麦克风。",12,Color.rgb(80,100,75)));
        TextView settingsError=text("",14,Color.rgb(160,90,60));form.addView(settingsError);
        Button clearRealtime=button("清除实时语音密钥");clearRealtime.setOnClickListener(v->{
            if(!isSession(settingsAccount,settingsEpoch))return;
            if(settings.edit().remove("realtime.key").commit()){realtimeKey.setText("");realtimeKey.setHint("填写 Qwen API Key");stopRealtime();settingsError.setText("已清除当前账号的实时语音密钥。");}
            else settingsError.setText("密钥未清除，请检查存储空间。");
        });form.addView(clearRealtime);
        AlertDialog accountDialog=new AlertDialog.Builder(this).setTitle("账号与 AI 设置").setView(scrollable(form))
            .setPositiveButton("保存",null)
            .setNeutralButton("退出账号",(d,w)->new AlertDialog.Builder(this).setTitle("退出当前账号？").setMessage("本机学习记录会保留，重新登录此账号可以继续。").setPositiveButton("退出",(x,y)->{try{accounts.logout();currentId=null;epoch++;showLogin();}catch(Exception e){new AlertDialog.Builder(this).setMessage(e.getMessage()).setPositiveButton("好",null).show();}}).setNegativeButton("取消",null).show())
            .setNegativeButton("取消",null).show();
        accountDialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            if(!isSession(settingsAccount,settingsEpoch)){accountDialog.dismiss();return;}
            try{
                String voiceId=realtimeVoice.getSelectedItemPosition()==voiceOptions.length-1?customVoice.getText().toString():String.valueOf(realtimeVoice.getSelectedItem());
                String qwenKey=realtimeKey.getText().toString().trim();if(qwenKey.isEmpty())qwenKey=settings.getString("realtime.key","");
                JSONObject c=RealtimeSettings.validate(new JSONObject().put("apiKey",qwenKey).put("voice",voiceId).put("base",realtimeBase.getText().toString()).toString());
                SharedPreferences.Editor edit=settings.edit().putString("realtime.key",c.getString("apiKey")).putString("realtime.voice",c.getString("voice")).putString("realtime.base",c.getString("base"));
                String value=key.getText().toString().trim();if(!value.isEmpty())edit.putString("ai.key",value);
                if(!edit.commit())throw new IllegalStateException("设置未保存，请检查存储空间。");
                stopRealtime();accountDialog.dismiss();
            }catch(Exception e){settingsError.setText(e instanceof IllegalArgumentException?e.getMessage():"设置未保存，请检查配置或存储空间。");}
        });
        cloud.setOnClickListener(v->{accountDialog.dismiss();if(web!=null)web.loadUrl(ORIGIN+"/assets/web/cloud/index.html");});
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
        if(!foreground||currentId==null||web==null||microphoneRequest!=null||microphonePromptActive||!MicrophonePolicy.permits(request.getOrigin().toString(),web.getUrl(),request.getResources())){request.deny();return;}
        microphoneRequest=request;microphoneAccount=currentId;microphoneEpoch=epoch;
        if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)completeMicrophone(true);
        else{microphonePromptActive=true;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MICROPHONE_REQUEST);}
    }
    private void completeMicrophone(boolean allowed){
        PermissionRequest request=microphoneRequest;microphoneRequest=null;
        if(request==null)return;
        if(allowed&&foreground&&isSession(microphoneAccount,microphoneEpoch)&&web!=null&&MicrophonePolicy.permits(request.getOrigin().toString(),web.getUrl(),request.getResources()))request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        else request.deny();
    }
    private void cancelMicrophone(){if(microphoneRequest!=null){microphoneRequest.deny();microphoneRequest=null;}}
    private void stopRealtime(){
        if(web!=null)web.evaluateJavascript("(function stop(w){try{w.dispatchEvent(new w.Event('growing-realtime-stop'));for(var i=0;i<w.frames.length;i++)stop(w.frames[i]);}catch(e){}})(window);",null);
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){
        super.onRequestPermissionsResult(request,permissions,grants);
        if(request==MICROPHONE_REQUEST){
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
