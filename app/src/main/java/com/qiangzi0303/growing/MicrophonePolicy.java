package com.qiangzi0303.growing;

/** Only the packaged, authenticated UI can request audio capture. Camera stays denied. */
final class MicrophonePolicy {
    static boolean permits(String origin,String page,String[] resources){
        String trusted="https://appassets.androidplatform.net";
        if((!trusted.equals(origin)&&!(trusted+"/").equals(origin))||page==null||!page.startsWith(trusted+"/assets/web/")||resources==null||resources.length!=1)return false;
        return "android.webkit.resource.AUDIO_CAPTURE".equals(resources[0]);
    }
}
