import { beforeEach, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises } from '@vue/test-utils';
vi.mock('../src/router',async()=>{
 const {createRouter,createMemoryHistory}=await import('vue-router');
 return {router:createRouter({history:createMemoryHistory(),routes:[
  {path:'/home',name:'home',component:{},meta:{title:'Home'}},
  {path:'/students/:id',name:'student-detail',component:{},meta:{title:'Student'}},
  {path:'/members',name:'members',component:{},meta:{title:'Members'}},
  {path:'/login',name:'login',component:{},meta:{title:'Login',constant:true}}
 ]})};
});
vi.mock('../src/store/modules/theme',()=>({useThemeStore:()=>({tab:{cache:true}})}));
vi.mock('../src/hooks/common/router',()=>({useRouterPush:()=>({routerPush:vi.fn(),routerPushByKey:vi.fn()})}));
vi.mock('../src/locales',()=>({$t:(key:string)=>key}));
vi.mock('../src/service/request',()=>({api:{cancelAll:vi.fn()}}));
vi.mock('../src/service/api/auth',()=>({fetchGetUserInfo:vi.fn(),fetchLogin:vi.fn(),fetchLogout:vi.fn()}));
import { router } from '../src/router';
import { localStg } from '../src/utils/storage';
import { resetSetupStore } from '../src/store/plugins';
import { useTabStore } from '../src/store/modules/tab';
import { useRouteStore } from '../src/store/modules/route';
import { useAuthStore } from '../src/store/modules/auth';
import { createRouteGuard } from '../src/router/guard/route';
beforeEach(()=>{
 localStorage.clear();
 const pinia=createPinia();pinia.use(resetSetupStore);createApp({}).use(pinia);setActivePinia(pinia);
});
function seedOldAccountTabs() {
 const tab=useTabStore();
 tab.initHomeTab();
 tab.addTab(router.resolve('/members') as App.Global.TabRoute);
 tab.addTab(router.resolve('/students/private-a') as App.Global.TabRoute);
 localStg.set('globalTabs',[...tab.tabs]);
 return tab;
}
it('does not restore another account tabs even when the template cache setting is true',()=>{
 const tabs=seedOldAccountTabs();
 useRouteStore().resetStore();
 useAuthStore().profile={id:'parent-b',username:'parentb',displayName:'B',role:'Parent',roleSelectionRequired:false};
 tabs.initHomeTab();
 tabs.initTabStore(router.resolve('/home') as App.Global.TabRoute);
 expect(tabs.tabs.map(t=>t.fullPath)).not.toContain('/members');
 expect(tabs.tabs.map(t=>t.fullPath)).not.toContain('/students/private-a');
 expect(localStg.get('globalTabs')).toBeNull();
});
it('never persists private route ids on cacheTabs or beforeunload',()=>{
 const tabs=useTabStore();tabs.addTab(router.resolve('/students/private-a') as App.Global.TabRoute);
 tabs.cacheTabs();window.dispatchEvent(new Event('beforeunload'));
 expect(localStg.get('globalTabs')).toBeNull();
});
it('clears only the legacy tab key on actual auth revocation and route reset',()=>{
 localStorage.setItem('unrelated-account-ai-settings','must-stay');
 seedOldAccountTabs();useAuthStore().clearSession();
 expect(localStg.get('globalTabs')).toBeNull();
 seedOldAccountTabs();useRouteStore().resetStore();
 expect(localStg.get('globalTabs')).toBeNull();
 expect(localStorage.getItem('unrelated-account-ai-settings')).toBe('must-stay');
});

it('clears actual in-memory tabs through the real auth revocation guard chain',async()=>{
 const auth=useAuthStore();
 auth.profile={id:'admin-a',username:'admina',displayName:'A',role:'Admin',roleSelectionRequired:false};auth.initialized=true;
 createRouteGuard(router);await router.push('/students/private-a');
 const tabs=seedOldAccountTabs();expect(tabs.tabs.map(t=>t.fullPath)).toContain('/members');
 auth.clearSession();await flushPromises();
 expect(tabs.tabs).toEqual([]);expect(router.currentRoute.value.path).toBe('/login');
 expect(localStg.get('globalTabs')).toBeNull();
});
