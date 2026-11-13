// "Instalar app" (PWA): o site vira um app com ícone na tela inicial do
// celular ou do computador. No Android/Chrome/Edge o navegador avisa que dá
// para instalar (beforeinstallprompt) e o botão abre a janela de instalar;
// no iPhone não tem esse aviso, então o botão explica o caminho no Safari.

const $ = (sel) => document.querySelector(sel);

const installed = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function initInstall({ onChange = () => {} } = {}) {
  const item = $('#home-install');
  if (!item || !('serviceWorker' in navigator) || installed()) return;
  // só com servidor: na versão de arquivo único não existe /sw.js e o botão
  // não aparece
  let prompt = null;
  let ok = false;
  const show = (on) => {
    item.hidden = !(on && ok);
    onChange();
  };
  // o aviso pode chegar antes de terminar o registro: guarda e mostra depois
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e;
    show(true);
  });
  try {
    await navigator.serviceWorker.register('/sw.js');
    ok = true;
  } catch {
    return;
  }
  if (prompt) show(true);
  window.addEventListener('appinstalled', () => {
    prompt = null;
    show(false);
  });
  if (isIos()) show(true);

  const box = $('#install-box');
  $('#install-ok').addEventListener('click', () => { box.hidden = true; });
  item.addEventListener('click', async () => {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice.catch(() => ({}));
      if (outcome === 'accepted') show(false);
      prompt = null;
      return;
    }
    $('#install-text').textContent = isIos()
      ? 'No Safari, toque no botão Compartilhar (o quadrado com a seta para cima) e depois em "Adicionar à Tela de Início".'
      : 'No menu do navegador (os três pontinhos), escolha "Instalar app" ou "Adicionar à tela inicial".';
    box.hidden = false;
  });
}
