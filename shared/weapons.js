// Armas que caem do céu. Cada arma tem atributos base e, em `byElement`,
// o que muda quando alguém de cada elemento pega nela.
//
// Efeitos de status suportados (ver game.js -> applyStatus):
//   queimadura: { duration, dps }        dano contínuo
//   encharcado: { duration, slow }       reduz a velocidade (0.4 = 40% mais lento)

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
        damage: 12,
        status: { type: 'queimadura', duration: 2.5, dps: 4 },
      },
      agua: {
        name: 'Lâmina da Maré',
        kbBase: 370, kbScale: 4.2,
        status: { type: 'encharcado', duration: 2.2, slow: 0.45 },
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
        damage: 9,
        explosion: { radius: 75, damage: 5 },
        status: { type: 'queimadura', duration: 2, dps: 3 },
      },
      agua: {
        name: "Jato d'Água",
        damage: 4, kbBase: 380, kbScale: 4.6, angle: 0.35,
        projectile: { speed: 900, radius: 13, life: 1.0, gravity: 0, pierce: true },
        status: { type: 'encharcado', duration: 1.5, slow: 0.35 },
      },
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
  delete profile.byElement;
  return profile;
}
