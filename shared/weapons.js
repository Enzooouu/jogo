// Armas que caem do céu. Cada arma tem atributos base e, em `byElement`,
// o que muda quando alguém de cada elemento pega nela.
//
// Efeitos de status suportados (ver game.js -> applyStatus):
//   queimadura: { duration, dps }        dano contínuo
//   encharcado: { duration, slow }       reduz a velocidade (0.4 = 40% mais lento)
//   atordoado:  { duration }             fica sem controle por um instante
// Projétil com `pull` puxa os inimigos próximos: { radius, strength }
// Arma com `lunge` faz o jogador avançar enquanto ataca: { speed, time }
// (no ar avança só 1 vez até pisar no chão de novo)

export const UNARMED = {
  id: 'soco', name: 'Soco', kind: 'melee',
  cooldown: 0.32, startup: 0.07, duration: 0.22,
  reach: 46, height: 40,
  damage: 6, kbBase: 240, kbScale: 3.0, angle: 0.62,
};

export const WEAPONS = {
  espada: {
    id: 'espada', name: 'Espada', kind: 'melee', uses: 14,
    cooldown: 0.42, startup: 0.1, duration: 0.3,
    reach: 82, height: 56,
    damage: 10, kbBase: 310, kbScale: 3.5, angle: 0.6,
    throwDamage: 12,
    byElement: {
      fogo: {
        name: 'Lâmina Flamejante',
        damage: 12, kbBase: 315, kbScale: 3.6,
        status: { type: 'queimadura', duration: 2.5, dps: 4 },
      },
      agua: {
        name: 'Lâmina da Maré',
        kbBase: 340, kbScale: 3.9,
        status: { type: 'encharcado', duration: 2.2, slow: 0.35 },
      },
      terra: {
        name: 'Espadão de Pedra',
        damage: 13, cooldown: 0.55, startup: 0.14, duration: 0.36, reach: 86,
        kbBase: 340, kbScale: 3.6,
        status: { type: 'atordoado', duration: 0.5 },
      },
      ar: {
        name: 'Lâmina do Vento',
        damage: 7, cooldown: 0.26, startup: 0.06, duration: 0.22, reach: 96,
        kbBase: 340, kbScale: 3.9,
      },
    },
  },
  cajado: {
    id: 'cajado', name: 'Cajado', kind: 'ranged', uses: 7,
    cooldown: 0.55, startup: 0.12, duration: 0.3,
    projectile: { speed: 760, radius: 11, life: 1.3, gravity: 0, pierce: false },
    damage: 7, kbBase: 240, kbScale: 2.7, angle: 0.5,
    throwDamage: 9,
    byElement: {
      fogo: {
        name: 'Bola de Fogo',
        damage: 9, kbBase: 255, kbScale: 2.85,
        explosion: { radius: 75, damage: 5 },
        status: { type: 'queimadura', duration: 2, dps: 3 },
      },
      agua: {
        name: "Jato d'Água",
        damage: 4, kbBase: 340, kbScale: 4.0, angle: 0.35,
        projectile: { speed: 900, radius: 13, life: 1.0, gravity: 0, pierce: true },
        status: { type: 'encharcado', duration: 1.5, slow: 0.25 },
      },
      terra: {
        name: 'Pedrada',
        damage: 11, kbBase: 300, kbScale: 3.4, angle: 0.55, cooldown: 0.7,
        projectile: { speed: 640, radius: 12, life: 1.6, gravity: 700, pierce: false },
        status: { type: 'atordoado', duration: 0.7 },
      },
      ar: {
        name: 'Tornado',
        damage: 3, kbBase: 260, kbScale: 2.4, angle: 1.15,
        projectile: { speed: 380, radius: 18, life: 1.8, gravity: 0, pierce: true },
        pull: { radius: 120, strength: 3600 },
      },
    },
  },
};

// Lança: investida para a frente com a ponta. Acerta cada inimigo uma vez
// e para quando acerta alguém.
WEAPONS.lanca = {
  id: 'lanca', name: 'Lança', kind: 'melee', uses: 10,
  cooldown: 0.62, startup: 0.09, duration: 0.34,
  reach: 64, height: 26,
  lunge: { speed: 860, time: 0.17 },
  damage: 11, kbBase: 330, kbScale: 3.6, angle: 0.45,
  throwDamage: 13,
  byElement: {
    fogo: {
      name: 'Lança Ígnea',
      damage: 12,
      status: { type: 'queimadura', duration: 2.5, dps: 4 },
    },
    agua: {
      name: 'Tridente da Maré',
      kbBase: 350, kbScale: 3.9, height: 32,
      status: { type: 'encharcado', duration: 2.2, slow: 0.35 },
    },
    terra: {
      name: 'Lança de Rocha',
      damage: 14, cooldown: 0.75, startup: 0.13, duration: 0.38,
      lunge: { speed: 760, time: 0.17 },
      kbBase: 350, kbScale: 3.7,
      status: { type: 'atordoado', duration: 0.5 },
    },
    ar: {
      name: 'Lança do Vento',
      damage: 8, cooldown: 0.5, startup: 0.07, duration: 0.3,
      lunge: { speed: 1050, time: 0.17 },
      kbBase: 330, kbScale: 3.8,
    },
  },
};

export const WEAPON_IDS = Object.keys(WEAPONS);

// Junta os atributos base da arma com as mudanças do elemento.
export function weaponProfile(weaponId, elementId) {
  const base = weaponId ? WEAPONS[weaponId] : UNARMED;
  if (!base) throw new Error(`Arma desconhecida: ${weaponId}`);
  const mod = base.byElement?.[elementId] ?? {};
  const profile = { ...base, ...mod };
  if (base.projectile || mod.projectile) {
    profile.projectile = { ...base.projectile, ...mod.projectile };
  }
  if (base.lunge || mod.lunge) profile.lunge = { ...base.lunge, ...mod.lunge };
  delete profile.byElement;
  return profile;
}
