package com.qiangzi0303.growing;

import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import java.util.Locale;
import org.json.JSONObject;

/** Android WebView does not reliably implement Web Speech. Use the installed TTS engine. */
public final class SpeechBridge {
    private final MainActivity activity;
    private final WebView web;
    private final String accountId;
    private final long session;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private TextToSpeech engine;
    private boolean ready, closed;
    private int initialization;
    private Request pending;
    private String active;
    private Runnable initTimeout;

    private static final class Request {
        final String id,text,language;
        final float rate,pitch;
        Request(String id,String text,String language,float rate,float pitch){
            this.id=id;this.text=text;this.language=language;this.rate=rate;this.pitch=pitch;
        }
    }
    SpeechBridge(MainActivity activity,WebView web,String accountId,long session){
        this.activity=activity;this.web=web;this.accountId=accountId;this.session=session;
    }
    private boolean allowed(){return !closed && activity.isSession(accountId,session);}
    @JavascriptInterface public void speak(String id,String text,String language,float rate,float pitch){
        handler.post(()->{
            if(!allowed())return;
            if(id==null || id.length()>100 || text==null || text.trim().isEmpty()
                || text.length()>TextToSpeech.getMaxSpeechInputLength()){
                emit(id,"error","invalid-argument", "朗读文本为空或过长。");return;
            }
            cancel();
            pending=new Request(id,text,language,Math.max(.5f,Math.min(2f,rate)),Math.max(.5f,Math.min(2f,pitch)));
            if(ready){play();return;}
            if(engine!=null)return;
            try{
                int attempt=++initialization;
                engine=new TextToSpeech(activity,status->handler.post(()->{if(attempt==initialization && engine!=null)initialized(status);}));
                initTimeout=()->{
                    if(!allowed() || ready)return;
                    fail("synthesis-unavailable","朗读引擎启动超时，请到账号 → 朗读设置检查系统语音服务。");
                    releaseEngine();
                };
                handler.postDelayed(initTimeout,12000);
            }catch(Exception e){
                fail("synthesis-unavailable","无法启动系统朗读，请到账号 → 朗读设置安装或启用文字转语音引擎。");
                releaseEngine();
            }
        });
    }
    private void initialized(int status){
        if(!allowed())return;
        if(initTimeout!=null)handler.removeCallbacks(initTimeout);
        if(status!=TextToSpeech.SUCCESS){
            fail("synthesis-unavailable","手机没有可用的朗读引擎，请到账号 → 朗读设置安装或启用文字转语音引擎。");
            releaseEngine();return;
        }
        ready=true;
        engine.setOnUtteranceProgressListener(new UtteranceProgressListener(){
            @Override public void onStart(String id){handler.post(()->{if(id.equals(active))emit(id,"start",null,null);});}
            @Override public void onDone(String id){handler.post(()->{if(id.equals(active)){active=null;emit(id,"end",null,null);}});}
            @Override public void onError(String id){onError(id,TextToSpeech.ERROR_SYNTHESIS);}
            @Override public void onError(String id,int code){handler.post(()->{
                if(!id.equals(active))return;
                String message=code==TextToSpeech.ERROR_NOT_INSTALLED_YET
                    ?"语音数据尚未安装，请到账号 → 朗读设置下载所需语言。"
                    :"系统朗读失败，请检查媒体音量、语音引擎及语言包；可到账号 → 朗读设置试读。";
                fail("synthesis-failed",message);
            });}
        });
        play();
    }
    private void play(){
        Request request=pending;if(request==null || !allowed())return;
        pending=null;active=request.id;
        try{
            String tag=request.language==null || request.language.isEmpty()?"en-GB":request.language;
            Locale locale=Locale.forLanguageTag(tag.replace('_','-'));
            int language=engine.setLanguage(locale);
            if(language==TextToSpeech.LANG_NOT_SUPPORTED && "en".equals(locale.getLanguage()))language=engine.setLanguage(Locale.US);
            if(language==TextToSpeech.LANG_MISSING_DATA || language==TextToSpeech.LANG_NOT_SUPPORTED){
                fail("language-unavailable","手机缺少"+("en".equals(locale.getLanguage())?"英语":"所选语言")+"语音，请到账号 → 朗读设置下载语言包或更换语音引擎。");return;
            }
            engine.setSpeechRate(request.rate);engine.setPitch(request.pitch);
            if(engine.speak(request.text,TextToSpeech.QUEUE_FLUSH,null,request.id)==TextToSpeech.ERROR)
                fail("synthesis-failed","系统未能开始朗读，请到账号 → 朗读设置检查语音引擎。");
        }catch(Exception e){fail("synthesis-failed","系统朗读不可用，请到账号 → 朗读设置检查语音引擎。");}
    }
    @JavascriptInterface public void stop(){handler.post(()->{if(allowed())cancel();});}
    void cancel(){pending=null;active=null;if(engine!=null)engine.stop();}
    void interrupt(){
        String id=active!=null?active:pending!=null?pending.id:null;
        cancel();if(id!=null)emit(id,"error","canceled",null);
    }
    private void fail(String code,String message){
        String id=active!=null?active:pending!=null?pending.id:null;
        pending=null;active=null;emit(id,"error",code,message);
        if(id!=null && allowed())Toast.makeText(activity,message,Toast.LENGTH_LONG).show();
    }
    private void emit(String id,String event,String error,String message){
        if(!allowed() || id==null)return;
        try{
            JSONObject payload=new JSONObject().put("id",id).put("type",event);
            if(error!=null)payload.put("error",error);
            if(message!=null)payload.put("message",message);
            web.evaluateJavascript("window.__growingSpeechEvent && window.__growingSpeechEvent("+payload+")",null);
        }catch(Exception ignored){ /* A page may have been destroyed during a system callback. */ }
    }
    private void releaseEngine(){
        initialization++;
        if(initTimeout!=null)handler.removeCallbacks(initTimeout);
        ready=false;if(engine!=null){engine.shutdown();engine=null;}
    }
    void close(){closed=true;cancel();releaseEngine();handler.removeCallbacksAndMessages(null);}
}
