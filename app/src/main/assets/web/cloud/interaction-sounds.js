import { play, setEnabled, setVolume, unlock } from './vendor/cuelume/index.js';

function initialize() {
try {
  if (window.parent !== window && window.parent.GrowingInteractionSounds) {
    window.parent.GrowingInteractionSounds.attach(document);
    return;
  }
} catch { /* A standalone or cross-origin page uses its own engine. */ }

const key = 'growing-interaction-sounds-v1';
let enabled = true;
try { enabled = localStorage.getItem(key) !== 'off'; } catch {}
setVolume(0.35);
setEnabled(enabled);
const button = document.createElement('button');
button.type = 'button';
button.id = 'interaction-sound-toggle';
const render = () => {
  button.textContent = enabled ? '音效：开' : '音效：关';
  button.setAttribute('aria-pressed', String(enabled));
  button.title = '切换交互音效（不影响课程朗读）';
};
render();
if(!location.pathname.startsWith('/console/'))(document.querySelector('#account-menu .account-menu-panel') || document.querySelector('.bar,.exam-tools'))?.append(button);
async function changeEnabled(value, persist=true) {
  enabled = !!value;
  setEnabled(enabled);
  if(persist)try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch {}
  render();
  window.dispatchEvent(new Event('growing:sound-changed'));
  if (enabled) {
    const ready = await unlock();
    if (ready) play('toggle', { emphasis: 'subtle' });
    else button.title = '浏览器暂未允许音效，请再次点击开启';
  }
  return enabled;
}
button.addEventListener('click', () => changeEnabled(!enabled));
window.addEventListener('storage', event => {
  if (event.key !== key && event.key !== null) return;
  changeEnabled(event.newValue !== 'off',false);
});

// Share one audio engine with same-origin classroom frames, including navigation.
const attached = new WeakSet();
function attach(doc) {
  if (attached.has(doc)) return;
  attached.add(doc);
  doc.addEventListener('click', event => {
    const control = event.target.closest?.('button,a[href],summary,[role="button"],[role="tab"]');
    if (!control || control === button || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
    // Speech/media controls already provide audible feedback.
    if (control.matches('[data-sound="off"]') || /朗读|播放|试听|录音|语音/.test(control.textContent)) return;
    let cue = 'tap';
    if (control.matches('summary')) cue = control.parentElement.open ? 'close' : 'open';
    else if (control.matches('a[href]')) cue = 'navigate';
    else if (control.matches('[role="tab"]')) cue = 'select';
    else if (control.hasAttribute('aria-expanded')) cue = control.getAttribute('aria-expanded') === 'true' ? 'close' : 'open';
    play(cue, { emphasis: 'subtle' });
  }, true);
  doc.addEventListener('change', event => {
    if (event.target.matches('select,input[type="radio"],input[type="checkbox"]')) {
      play(event.target.matches('select,input[type="radio"]') ? 'select' : 'toggle', { emphasis: 'subtle' });
    }
  }, true);
  const attachFrame = frame => {
    try { if (frame.contentDocument) attach(frame.contentDocument); } catch { /* Cross-origin frames own their audio. */ }
  };
  doc.addEventListener('load', event => {
    if (event.target.tagName === 'IFRAME') attachFrame(event.target);
  }, true);
  doc.querySelectorAll('iframe').forEach(attachFrame);
}
window.GrowingInteractionSounds = { attach, isEnabled:()=>enabled, setEnabled:changeEnabled };
attach(document);
}
initialize();
