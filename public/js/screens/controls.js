// Tela de controles: cada movimento tem um botão da tecla principal e um da
// tecla extra. Clique no botão e aperte a tecla (ou um botão do mouse).

import { ACTIONS, DEFAULT_BINDINGS, loadBindings, saveBindings, assignKey, clearExtra, keyLabel, cloneBindings } from '../input/bindings.js';

export function initControls(panel) {
  const list = panel.querySelector('#bind-list');
  const msg = panel.querySelector('#bind-msg');
  let bindings = loadBindings();
  let waiting = null; // { action, slot, button }

  const say = (text, bad = false) => {
    msg.textContent = text;
    msg.classList.toggle('error', bad);
  };

  function render() {
    list.replaceChildren();
    for (const { id, name } of ACTIONS) {
      const row = document.createElement('div');
      row.className = 'bind-row';
      const label = document.createElement('span');
      label.className = 'name';
      label.textContent = name;
      row.appendChild(label);
      for (const slot of [0, 1]) {
        const box = document.createElement('div');
        box.className = 'bind-slot';
        const code = bindings[id][slot];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bind-btn' + (code ? '' : ' empty');
        btn.textContent = code ? keyLabel(code) : 'vazio';
        btn.title = slot === 0 ? 'Tecla principal (obrigatória)' : 'Tecla extra (opcional)';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          startListening(id, slot, btn);
        });
        box.appendChild(btn);
        if (slot === 1 && code) {
          const clear = document.createElement('button');
          clear.type = 'button';
          clear.className = 'bind-clear';
          clear.textContent = '×';
          clear.title = 'Tirar a tecla extra';
          clear.addEventListener('click', (e) => {
            e.stopPropagation();
            stopListening();
            bindings = clearExtra(bindings, id);
            saveBindings(bindings);
            say('');
            render();
          });
          box.appendChild(clear);
        }
        row.appendChild(box);
      }
      list.appendChild(row);
    }
  }

  function startListening(action, slot, button) {
    stopListening();
    waiting = { action, slot, button };
    button.classList.add('listening');
    button.textContent = 'aperte…';
    say('Aperte a tecla ou o botão do mouse. Esc cancela.');
    // espera o clique que abriu terminar antes de ouvir o mouse
    setTimeout(() => {
      if (!waiting) return;
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('mousedown', onMouse, true);
      window.addEventListener('contextmenu', blockMenu, true);
    }, 0);
  }

  function stopListening() {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('mousedown', onMouse, true);
    window.removeEventListener('contextmenu', blockMenu, true);
    if (waiting) {
      // devolve o texto do botão que estava esperando
      const code = bindings[waiting.action][waiting.slot];
      waiting.button.classList.remove('listening');
      waiting.button.textContent = code ? keyLabel(code) : 'vazio';
    }
    waiting = null;
  }

  function finish(code) {
    const { action, slot } = waiting;
    stopListening();
    const res = assignKey(bindings, action, slot, code);
    if (res.ok) {
      bindings = res.bindings;
      saveBindings(bindings);
      say(res.message || `${keyLabel(code)} salvo.`);
    } else {
      say(res.message, true);
    }
    render();
  }

  function onKey(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      stopListening();
      say('');
      render();
      return;
    }
    finish(e.code);
  }

  function onMouse(e) {
    // clicar em outro botão (Fechar, Restaurar, outra tecla) só cancela
    const other = e.target.closest?.('button');
    if (other && other !== waiting.button) {
      stopListening();
      say('');
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    finish(`Mouse${e.button}`);
  }

  function blockMenu(e) {
    e.preventDefault();
  }

  panel.querySelector('#bind-reset').addEventListener('click', () => {
    stopListening();
    bindings = cloneBindings(DEFAULT_BINDINGS);
    saveBindings(bindings);
    say('Teclas voltaram ao padrão.');
    render();
  });

  render();
  return {
    // chamado quando o painel abre ou fecha
    refresh() {
      stopListening();
      bindings = loadBindings();
      say('');
      render();
    },
  };
}
