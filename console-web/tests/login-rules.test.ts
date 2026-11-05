import { beforeEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { NForm, NFormItem, NInput, NButton } from 'naive-ui';
const login = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock('../src/store/modules/auth', () => ({
  useAuthStore: () => ({
    login,
    loginLoading: false,
    sessionRevision: 0,
    profile: { role: 'Parent', roleSelectionRequired: false }
  })
}));
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../src/locales', () => ({ $t: (key: string) => key }));
vi.mock('../src/hooks/common/router', () => ({ useRouterPush: () => ({ toggleLoginModule: vi.fn() }) }));
import PwdLogin from '../src/views/_builtin/login/modules/pwd-login.vue';
beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});
it('names and focuses the native username and password inputs', () => {
  const wrapper = mount(PwdLogin, {
    attachTo: document.body,
    global: { components: { NForm, NFormItem, NInput, NButton }, mocks: { $t: (key: string) => key } }
  });
  try {
    for (const [type, name] of [['text', '用户名'], ['password', '密码']]) {
      const input = wrapper.get(`input[type=${type}]`).element as HTMLInputElement;
      const accessibleName = input.getAttribute('aria-label') || Array.from(input.labels || []).map(label => label.textContent?.trim()).join(' ');
      expect(accessibleName).toBe(name);
      input.focus();
      expect(document.activeElement).toBe(input);
      expect(input.disabled).toBe(false);
      expect(input.tabIndex).toBe(0);
    }
  } finally { wrapper.unmount(); }
});
it.each(['符号! password-12345678901234567890', 'a'.repeat(128)])(
  'accepts real Unicode usernames and valid symbol/long passwords',
  async password => {
    const wrapper = mount(PwdLogin, {
      global: {
        components: { NForm, NFormItem, NInput, NButton },
        mocks: { $t: (key: string) => key },
        stubs: { NSpace: { template: '<div><slot /></div>' }, NCheckbox: true, NDivider: true }
      }
    });
    await wrapper.find('input[type=text]').setValue('家长一');
    await wrapper.find('input[type=password]').setValue(password);
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(login).toHaveBeenCalledWith('家长一', password);
    wrapper.unmount();
  }
);

it.each([['a','long-enough-password'],['家长一','short']])('rejects invalid credentials before sending a request',async(username,password)=>{
  const wrapper=mount(PwdLogin,{global:{components:{NForm,NFormItem,NInput,NButton},mocks:{$t:(key:string)=>key}}});
  await wrapper.find('input[type=text]').setValue(username);
  await wrapper.find('input[type=password]').setValue(password);
  await wrapper.find('button').trigger('click');await flushPromises();
  expect(login).not.toHaveBeenCalled();
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  wrapper.unmount();
});
