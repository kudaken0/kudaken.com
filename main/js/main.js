(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initMenu() {
    const button = document.querySelector('.hamburger-overlay');
    const nav = document.querySelector('.nav-overlay');
    if (!button || !nav) return;

    const background = [...document.querySelectorAll('main, .header > a')];
    let previousOverflow = '';
    let previousInert = [];
    let isOpen = false;

    function setOpen(open) {
      if (open === isOpen) return;
      isOpen = open;
      button.classList.toggle('active', open);
      nav.classList.toggle('active', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニュー');

      if (open) {
        previousOverflow = document.body.style.overflow;
        previousInert = background.map(element => element.inert);
        background.forEach(element => { element.inert = true; });
        document.body.style.overflow = 'hidden';
        nav.inert = false;
        nav.setAttribute('aria-hidden', 'false');
        const firstLink = nav.querySelector('a[href]');
        if (firstLink) firstLink.focus();
      } else {
        button.focus();
        nav.inert = true;
        nav.setAttribute('aria-hidden', 'true');
        background.forEach((element, index) => { element.inert = previousInert[index]; });
        document.body.style.overflow = previousOverflow;
      }
    }

    button.addEventListener('click', () => setOpen(!isOpen));
    document.addEventListener('keydown', event => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab') {
        const focusable = [button, ...nav.querySelectorAll('a[href]')];
        const index = focusable.indexOf(document.activeElement);
        const next = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
        event.preventDefault();
        focusable[next].focus();
      }
    });
    // 戻る操作でページが復元されたときもメニューを閉じた状態にする。
    window.addEventListener('pageshow', () => setOpen(false));
  }

  function initAnimations() {
    const triggers = [...document.querySelectorAll('.bgRLextendTrigger, .bgappearTrigger')];
    if (!triggers.length) return;
    document.documentElement.classList.add('js');
    let scheduled = false;

    function update() {
      scheduled = false;
      // 従来と同じく、画面下端の50px手前で開始し、下へ戻れば解除する。
      const states = triggers.map(element => reducedMotion.matches || element.getBoundingClientRect().top <= window.innerHeight + 50);
      triggers.forEach((element, index) => {
        const animation = element.classList.contains('bgRLextendTrigger') ? 'bgRLextend' : 'bgappear';
        element.classList.toggle(animation, states[index]);
      });
    }

    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    reducedMotion.addEventListener('change', scheduleUpdate);
    update();
  }

  function initVideo() {
    const video = document.querySelector('.video video');
    if (!video) return;
    function updatePlayback() {
      video.autoplay = !reducedMotion.matches;
      if (reducedMotion.matches) {
        video.pause();
      } else {
        // 自動再生がブラウザーに拒否されても未処理のPromiseにしない。
        const playback = video.play();
        if (playback) playback.catch(() => {});
      }
    }
    reducedMotion.addEventListener('change', updatePlayback);
    updatePlayback();
  }

  function init() {
    initMenu();
    initAnimations();
    initVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
