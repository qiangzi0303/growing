import { beforeEach, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import { mount, flushPromises } from '@vue/test-utils';
import { NCard, NButton, NForm, NFormItem, NInput } from 'naive-ui';
const transport=vi.hoisted(()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);return {fetcher};
});
vi.mock('../src/store/modules/route',()=>({useRouteStore:()=>({initAuthRoute:vi.fn(),resetStore:vi.fn()})}));
vi.mock('../src/locales',()=>({$t:(key:string)=>key}));
import { useAuthStore } from '../src/store/modules/auth';
import { request } from '../src/service/request';
import { createRouteGuard } from '../src/router/guard/route';
import Login from '../src/views/_builtin/login/index.vue';

beforeEach(()=>{setActivePinia(createPinia());vi.clearAllMocks();});
async function openPrivatePage() {
  transport.fetcher.mockResolvedValueOnce(Response.json({id:'p',username:'parent',displayName:'Parent',role:'Parent',roleSelectionRequired:false}));
  const router=createRouter({history:createMemoryHistory('/console/'),routes:[
    {path:'/students/a',name:'student-detail',component:{template:'<p>private student</p>'}},
    {path:'/login',name:'login',component:Login,meta:{title:'登录',constant:true}}
  ]});
  createRouteGuard(router);
  await router.push('/students/a');await router.isReady();
  const wrapper=mount(RouterView,{global:{plugins:[router],components:{NCard,NButton,NForm,NFormItem,NInput},mocks:{$t:(key:string)=>key}}});
  expect(wrapper.text()).toContain('private student');
  return {router,wrapper,store:useAuthStore()};
}
it('moves real logout to login and leaves failed server logout retryable there',async()=>{
  const {router,wrapper,store}=await openPrivatePage();
  transport.fetcher.mockResolvedValueOnce(Response.json({error:'offline'},{status:503}));
  expect(await store.resetStore()).toBe(false);await flushPromises();
  expect(transport.fetcher.mock.calls[1][0]).toBe('/api/auth/logout');
  expect(transport.fetcher.mock.calls[1][1].method).toBe('POST');
  expect(router.currentRoute.value.path).toBe('/login');
  expect(wrapper.text()).not.toContain('private student');
  expect(wrapper.find('input[type=password]').exists()).toBe(true);
  expect(wrapper.find('[role=alert]').text()).toContain('退出未完成');
  transport.fetcher.mockResolvedValueOnce(new Response(null,{status:204}));
  await wrapper.findAll('button').find(b=>b.text()==='重试退出')!.trigger('click');await flushPromises();
  expect(wrapper.find('[role=alert]').exists()).toBe(false);
  wrapper.unmount();
});
it('moves a real request-layer 401 to the login form and displays a failed re-login',async()=>{
  const {router,wrapper}=await openPrivatePage();
  transport.fetcher.mockResolvedValueOnce(Response.json({error:'expired'},{status:401}));
  await request({url:'/parent/children'});await flushPromises();
  expect(router.currentRoute.value.path).toBe('/login');
  expect(wrapper.text()).not.toContain('private student');
  expect(wrapper.find('input[type=password]').exists()).toBe(true);
  expect(transport.fetcher).toHaveBeenCalledTimes(2);
  await wrapper.find('input[type=text]').setValue('parent');
  await wrapper.find('input[type=password]').setValue('wrong-password');
  transport.fetcher.mockResolvedValueOnce(Response.json({error:'wrong password'},{status:401}));
  await wrapper.findAll('button').find(b=>b.text()==='登录')!.trigger('click');await flushPromises();
  expect(wrapper.find('[role=alert]').text()).toContain('登录失败');
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  wrapper.unmount();
});
