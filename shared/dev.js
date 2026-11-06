// Contas de desenvolvedor do Elementum (só elas veem o modo ADM quando o
// jogo tem servidor e contas). Na versão sem servidor o ADM fica liberado.
// Também vai servir para a conquista "Derrubei o Criador" no modo online.

export const DEVELOPERS = ['enzoofoda'];

export function isDeveloper(username) {
  return typeof username === 'string' && DEVELOPERS.includes(username.trim().toLowerCase());
}
