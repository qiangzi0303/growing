import { beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({ replace: vi.fn() }) }));
const mocks = vi.hoisted(() => ({ fetchLogin: vi.fn(), validate: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/service/api/auth', () => ({
  fetchLogin: mocks.fetchLogin,
  fetchLogout: vi.fn(),
  fetchGetUserInfo: vi.fn()
}));
vi.mock('../src/service/request', () => ({ api: { cancelAll: vi.fn() } }));
vi.mock('../src/locales', () => ({ $t: (key: string) => key }));
vi.mock('../src/hooks/common/form', () => ({
  useNaiveForm: () => ({ validate: mocks.validate }),
  useFormRules: () => ({ formRules: {} })
}));
vi.mock('../src/hooks/common/router', () => ({ useRouterPush: () => ({ toggleLoginModule: vi.fn() }) }));
import { useAuthStore } from '../src/store/modules/auth';
import PwdLogin from '../src/views/_builtin/login/modules/pwd-login.vue';

const Form = defineComponent({
  props: ['model'],
  setup:
    (_, { slots }) =>
    () =>
      h('form', slots.default?.())
});
const Input = defineComponent({
  props: ['value', 'type'],
  emits: ['update:value'],
  setup:
    (props, { emit }) =>
    () =>
      h('input', {
        type: props.type || 'text',
        value: props.value,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
      })
});
function render() {
  return mount(PwdLogin, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        NForm: Form,
        NFormItem: { template: '<div><slot /></div>' },
        NInput: Input,
        NSpace: { template: '<div><slot /></div>' },
        NButton: { template: '<button><slot /></button>' },
        NCheckbox: true,
        NDivider: true
      }
    }
  });
}
beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  mocks.validate.mockResolvedValue(undefined);
});

it.each([true, false])('clears the actual password field after submission (success=%s)', async success => {
  mocks.fetchLogin.mockResolvedValue(
    success
      ? { data: { user: { id: 'p', username: 'p', role: 'Parent', roleSelectionRequired: false } }, error: null }
      : { data: null, error: new Error('denied') }
  );
  const wrapper = render();
  await wrapper.find('input[type=password]').setValue('private-draft');
  await wrapper
    .findAll('button')
    .find(button => button.text() === '登录')!
    .trigger('click');
  await flushPromises();
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  expect(mocks.fetchLogin).toHaveBeenCalledWith(expect.any(String), 'private-draft');
  wrapper.unmount();
});

it('clears a typed draft when the session is revoked and on unmount', async () => {
  const wrapper = render();
  await wrapper.find('input[type=password]').setValue('private-draft');
  useAuthStore().clearSession();
  await flushPromises();
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  await wrapper.find('input[type=password]').setValue('another-draft');
  const model = wrapper.findComponent(Form).props('model');
  wrapper.unmount();
  expect(model.password).toBe('');
});

it('clears the draft even when validation rejects', async () => {
  mocks.validate.mockRejectedValue(new Error('validation'));
  const wrapper = render();
  await wrapper.find('input[type=password]').setValue('private-draft');
  await wrapper
    .findAll('button')
    .find(button => button.text() === '登录')!
    .trigger('click');
  await flushPromises();
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  expect(mocks.fetchLogin).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('ignores Enter or click while a session transition is already loading', async () => {
  const store = useAuthStore();
  store.loginLoading = true;
  const wrapper = render();
  await wrapper.find('button').trigger('click');
  await wrapper.find('form').trigger('keyup.enter');
  await flushPromises();
  expect(mocks.validate).not.toHaveBeenCalled();
  expect(mocks.fetchLogin).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('locks submission while validation is pending and unlocks after rejection', async () => {
  let reject!: (reason: Error) => void;
  mocks.validate.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
  mocks.fetchLogin.mockResolvedValue({ data: null, error: new Error('denied') });
  const wrapper = render();
  await wrapper.find('input[type=password]').setValue('private-draft');
  await wrapper.find('button').trigger('click');
  await wrapper.find('form').trigger('keyup.enter');
  expect(mocks.validate).toHaveBeenCalledOnce();
  reject(new Error('validation'));
  await flushPromises();
  expect((wrapper.find('input[type=password]').element as HTMLInputElement).value).toBe('');
  expect(mocks.fetchLogin).not.toHaveBeenCalled();
  await wrapper.find('input[type=password]').setValue('new-private-draft');
  await wrapper.find('button').trigger('click');
  await flushPromises();
  expect(mocks.validate).toHaveBeenCalledTimes(2);
  expect(mocks.fetchLogin).toHaveBeenCalledOnce();
  wrapper.unmount();
});
