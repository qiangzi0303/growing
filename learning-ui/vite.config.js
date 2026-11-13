import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{lib:{entry:'src/index.js',name:'GrowingVantHome',formats:['iife'],fileName:()=> 'learning-ui.js',cssFileName:'learning-ui'},target:'es2020'}});
