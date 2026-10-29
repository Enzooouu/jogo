// Elementos e perigos do mapa.
//
// stats: jeito de jogar de cada elemento
//   speed  = multiplicador da velocidade de andar
//   jump   = multiplicador da força do pulo
//   weight = quanto mais pesado, menos voa ao apanhar (empurrão / weight)
//   airDashes = quantos dashes no ar até pisar no chão (padrão 1)

export const ELEMENTS = {
  fogo: {
    id: 'fogo', name: 'Fogo', enabled: true,
    color: '#ff6a1f', light: '#ffd25a', dark: '#8a2a05',
    description: 'Atravessa a lava. Morre na água.',
    stats: { speed: 1, jump: 1, weight: 0.93 },
  },
  agua: {
    id: 'agua', name: 'Água', enabled: true,
    color: '#2f8cff', light: '#9fe3ff', dark: '#0b3b8a',
    description: 'Nada na água. Morre na lava.',
    stats: { speed: 1, jump: 1, weight: 1 },
  },
  terra: {
    id: 'terra', name: 'Terra', enabled: true,
    color: '#9a6b3a', light: '#d8b27a', dark: '#4a2f14',
    description: 'Pisa nos espinhos. Pesado: o vento e os golpes empurram menos.',
    stats: { speed: 0.88, jump: 1, weight: 1.08 },
  },
  ar: {
    id: 'ar', name: 'Ar', enabled: true,
    color: '#bfe9e1', light: '#ffffff', dark: '#5e8f87',
    description: 'O vento não o empurra. Rápido, pula alto e tem 2 dashes no ar.',
    stats: { speed: 1.15, jump: 1.1, weight: 0.93, airDashes: 2 },
  },
};

export const HAZARDS = {
  lava: { id: 'lava', name: 'Lava' },
  agua: { id: 'agua', name: 'Água' },
  espinhos: { id: 'espinhos', name: 'Espinhos', dps: 6 },  // +6% de dano por segundo
  vento: { id: 'vento', name: 'Vento' },                    // rajadas que empurram para fora
};

// O que acontece quando um elemento toca num perigo:
//   'imune'   -> nada acontece
//   'morre'   -> perde uma vida na hora
//   'dano'    -> soma dano (%) a cada segundo (espinhos)
//   'empurra' -> é empurrado (vento)
// Combinação não listada -> 'morre'.
export const HAZARD_REACTION = {
  fogo: { lava: 'imune', agua: 'morre', espinhos: 'dano', vento: 'empurra' },
  agua: { agua: 'imune', lava: 'morre', espinhos: 'dano', vento: 'empurra' },
  terra: { espinhos: 'imune', lava: 'morre', agua: 'morre', vento: 'empurra' },
  ar: { vento: 'imune', lava: 'morre', agua: 'morre', espinhos: 'dano' },
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
