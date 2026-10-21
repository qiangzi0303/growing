package com.qiangzi0303.growing;

import android.app.Activity;
import android.app.AlertDialog;
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
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
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

public final class MainActivity extends Activity {
    private static final String ORIGIN="https://appassets.androidplatform.net";
    private static final String HOME=ORIGIN+"/assets/web/app-design/index.html";
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

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        accounts=new AccountStore(this);
        currentId=accounts.currentId();
        if(currentId==null) showLogin(); else showLearning();
    }
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private LinearLayout column(){LinearLayout result=new LinearLayout(this);result.setOrientation(LinearLayout.VERTICAL);return result;}
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
        LinearLayout form=column();form.setGravity(Gravity.CENTER_VERTICAL);form.setPadding(dp(30),dp(35),dp(30),dp(35));scroll.addView(form,new ScrollView.LayoutParams(-1,-1));
        TextView title=text("成长",34,Color.rgb(45,68,52));title.setTypeface(null,Typeface.BOLD);form.addView(title);
        TextView hint=text(registering?"创建你的学习账号":"登录，继续你的学习",18,Color.rgb(80,110,70));hint.setPadding(0,dp(12),0,dp(24));form.addView(hint);
        EditText name=input("用户名（2—24 个字符）",false);name.setContentDescription("用户名");form.addView(name);
        EditText password=input("密码（至少 8 个字符）",true);password.setContentDescription("密码");form.addView(password);
        EditText confirm=input("再次输入密码",true);confirm.setContentDescription("确认密码");if(registering)form.addView(confirm);
        TextView error=text("",14,Color.rgb(160,90,60));error.setPadding(0,dp(12),0,dp(8));form.addView(error);
        Button submit=button(registering?"注册并开始学习":"登录");form.addView(submit);
        Button toggle=button(registering?"已有账号？去登录":"还没有账号？注册");form.addView(toggle);
        TextView note=text("本机账号 · 学习记录按账号分别保存\n覆盖安装新版会保留账号与学习记录；卸载或清除应用数据会删除本机记录。",12,Color.rgb(125,136,118));note.setPadding(0,dp(22),0,0);note.setLineSpacing(dp(3),1);form.addView(note);
        toggle.setOnClickListener(v->{registering=!registering;showLogin();});
        submit.setOnClickListener(v->{
            String username=name.getText().toString();char[] secret=password.getText().toString().toCharArray();
            if(registering && !Arrays.equals(secret,confirm.getText().toString().toCharArray())){Arrays.fill(secret,'\0');error.setText("两次输入的密码不一致。");return;}
            boolean register=registering;submit.setEnabled(false);toggle.setEnabled(false);error.setText("正在验证，请稍候…");
            executor.execute(()->{
                try{String id=accounts.authenticate(username,secret,register);runOnUiThread(()->{if(isFinishing()||isDestroyed())return;currentId=id;epoch++;showLearning();});}
                catch(Exception e){String message=e.getMessage();runOnUiThread(()->{if(isFinishing()||isDestroyed())return;error.setText(message==null?"操作未完成，请重试。":message);submit.setEnabled(true);toggle.setEnabled(true);});}
            });
        });
    }
    private void showLearning(){
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)){
            new AlertDialog.Builder(this).setTitle("请更新系统 WebView").setMessage("当前 Android System WebView 版本较旧。请在应用商店更新后重新打开成长，以确保账号记录隔离。").setPositiveButton("关闭",(d,w)->finish()).setCancelable(false).show();return;
        }
        destroyWeb();
        LinearLayout outer=column();attachRoot(outer);
        LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);toolbar.setPadding(dp(8),0,dp(8),0);
        back=button("‹ 返回选科");back.setOnClickListener(v->loadHome());toolbar.addView(back);
        screenTitle=text("",14,Color.rgb(80,110,70));screenTitle.setGravity(Gravity.CENTER);toolbar.addView(screenTitle,new LinearLayout.LayoutParams(0,dp(48),1));
        Button account=button("账号");account.setOnClickListener(v->showAccount());toolbar.addView(account);outer.addView(toolbar,new LinearLayout.LayoutParams(-1,dp(48)));
        web=new WebView(this);outer.addView(web,new LinearLayout.LayoutParams(-1,0,1));
        web.setBackgroundColor(Color.rgb(247,248,243));
        web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setMediaPlaybackRequiresUserGesture(true);
        web.getSettings().setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.addJavascriptInterface(new LearningBridge(this,currentId,epoch),"GrowingNative");
        speech=new SpeechBridge(this,web,currentId,epoch);
        web.addJavascriptInterface(speech,"GrowingSpeech");
        try{
            java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
            for(String asset:new String[]{"speech-bootstrap.js","bootstrap.js"}){
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
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){if(speech!=null)speech.cancel();}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){return loader.shouldInterceptRequest(request.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl();
                if("https".equals(url.getScheme())&&"appassets.androidplatform.net".equals(url.getHost())&&url.getPath()!=null&&url.getPath().startsWith("/assets/web/"))return false;
                if(request.isForMainFrame()&&"https".equals(url.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,url));}catch(Exception ignored){}}
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){boolean home=HOME.equals(url);back.setVisibility(home?View.INVISIBLE:View.VISIBLE);screenTitle.setText(home?"":url.contains("word-ops")?"英语 · Unit 3":url.contains("fraction-ops")?"数学 · 分式":url.contains("subject=english")||url.contains("english-course")?"英语":url.contains("subject=physics")||url.contains("physics-")?"物理":url.contains("math-course")||url.contains("knowledge")||url.contains("subject=math")?"数学":"成长课堂");}
        });
        loadHome();
    }
    public void loadHome(){if(web!=null)web.loadUrl(HOME);}
    public boolean isSession(String id,long value){return id!=null&&id.equals(currentId)&&value==epoch;}
    public void showAccount(){
        if(currentId==null)return;
        SharedPreferences settings=getSharedPreferences("settings-v1-"+currentId,MODE_PRIVATE);
        LinearLayout form=column();form.setPadding(dp(24),dp(8),dp(24),0);
        TextView note=text("本机账号："+accounts.currentName()+"\n版本："+BuildConfig.VERSION_NAME+"\n\n课程、内置音频和练习可离线使用。单词朗读使用手机语音引擎，离线使用需先安装英语语音数据。AI 评分和答疑需要联网并配置自己的 DeepSeek API Key。密钥只保存在此账号的本机设置中。",14,Color.rgb(80,100,75));form.addView(note);
        Button voice=button("朗读设置 / 英语试读");voice.setOnClickListener(v->showSpeechSettings());form.addView(voice);
        EditText key=input(settings.getString("ai.key","").isEmpty()?"填写 DeepSeek API Key":"已配置，留空保持现有密钥",true);form.addView(key);
        new AlertDialog.Builder(this).setTitle("账号与 AI 设置").setView(form)
            .setPositiveButton("保存",(d,w)->{String value=key.getText().toString().trim();if(!value.isEmpty()&&!settings.edit().putString("ai.key",value).commit())new AlertDialog.Builder(this).setMessage("密钥未保存，请检查存储空间后重试。").setPositiveButton("好",null).show();})
            .setNeutralButton("退出账号",(d,w)->new AlertDialog.Builder(this).setTitle("退出当前账号？").setMessage("本机学习记录会保留，重新登录此账号可以继续。").setPositiveButton("退出",(x,y)->{try{accounts.logout();currentId=null;epoch++;showLogin();}catch(Exception e){new AlertDialog.Builder(this).setMessage(e.getMessage()).setPositiveButton("好",null).show();}}).setNegativeButton("取消",null).show())
            .setNegativeButton("取消",null).show();
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
        form.addView(text("朗读使用 Android 系统语音服务。请先选择可用引擎，并下载英语语音数据（数学设备朗读另需中文）。\n\n试读时调高媒体音量；若引擎仅支持在线语音，还需要联网。下载语言包后建议重新打开成长。",14,Color.rgb(80,100,75)));
        Button test=button("试读英语：Hello, welcome to Growing");
        test.setOnClickListener(v->{if(web!=null)web.evaluateJavascript("speechSynthesis.cancel();var t=new SpeechSynthesisUtterance('Hello, welcome to Growing.');t.lang='en-GB';speechSynthesis.speak(t);",null);});form.addView(test);
        new AlertDialog.Builder(this).setTitle("朗读设置").setView(form)
            .setPositiveButton("系统语音设置",(d,w)->openSpeechSettings(false))
            .setNeutralButton("安装语音数据",(d,w)->openSpeechSettings(true))
            .setNegativeButton("关闭",null).show();
    }
    private void destroyWeb(){
        if(speech!=null){speech.close();speech=null;}
        if(web!=null){web.stopLoading();web.removeJavascriptInterface("GrowingNative");web.removeJavascriptInterface("GrowingSpeech");web.destroy();web=null;}
    }
    @Override public void onBackPressed(){if(web!=null&&!HOME.equals(web.getUrl()))loadHome();else super.onBackPressed();}
    @Override protected void onPause(){if(speech!=null)speech.interrupt();if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){destroyWeb();executor.shutdown();super.onDestroy();}
}
