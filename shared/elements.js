// Elementos e perigos do mapa.
//
// Para adicionar Terra e Ar: troque `enabled` para true e confira a tabela
// HAZARD_REACTION. As armas também precisam de uma entrada para o elemento
// em shared/weapons.js (senão usam o efeito padrão).

export const ELEMENTS = {
  fogo: {
    id: 'fogo', name: 'Fogo', enabled: true,
    color: '#ff6a1f', light: '#ffd25a', dark: '#8a2a05',
    description: 'Atravessa a lava. Morre na água.',
  },
  agua: {
    id: 'agua', name: 'Água', enabled: true,
    color: '#2f8cff', light: '#9fe3ff', dark: '#0b3b8a',
    description: 'Nada na água. Morre na lava.',
  },
  terra: {
    id: 'terra', name: 'Terra', enabled: false,
    color: '#9a6b3a', light: '#d8b27a', dark: '#4a2f14',
    description: 'Em breve.',
  },
  ar: {
    id: 'ar', name: 'Ar', enabled: false,
    color: '#bfe9e1', light: '#ffffff', dark: '#5e8f87',
    description: 'Em breve.',
  },
};

export const HAZARDS = {
  lava: { id: 'lava', name: 'Lava' },
  agua: { id: 'agua', name: 'Água' },
  espinhos: { id: 'espinhos', name: 'Espinhos' },   // fase futura
  vento: { id: 'vento', name: 'Vento' },             // fase futura
};

// O que acontece quando um elemento toca num perigo:
//   'imune' -> nada acontece
//   'morre' -> perde uma vida na hora
// Combinação não listada -> 'morre' (perigo é perigo).
// Linhas de terra/ar são provisórias, só para mostrar onde configurar.
export const HAZARD_REACTION = {
  fogo: { lava: 'imune', agua: 'morre' },
  agua: { agua: 'imune', lava: 'morre' },
  terra: { espinhos: 'imune', vento: 'morre' },
  ar: { vento: 'imune', espinhos: 'morre' },
};

export function hazardReaction(elementId, hazardId) {
  return HAZARD_REACTION[elementId]?.[hazardId] ?? 'morre';
}

// Regra dos times: cada time é de um elemento só, e dois times nunca têm
// o mesmo elemento. Devolve a mensagem de erro, ou null se estiver tudo certo.
export function teamElementsError(players) {
  const byTeam = new Map();
  for (const p of players) {
    const el = byTeam.get(p.team);
    if (el && el !== p.element) return `O time ${p.team} mistura elementos (${el} e ${p.element}).`;
    byTeam.set(p.team, p.element);
  }
  const elements = [...byTeam.values()];
  if (new Set(elements).size !== elements.length) return 'Dois times não podem ter o mesmo elemento.';
  return null;
}

export function enabledElements() {
  return Object.values(ELEMENTS).filter((e) => e.enabled);
}
