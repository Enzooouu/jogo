#!/bin/bash
# Prepara um servidor Ubuntu (Magalu Cloud) para rodar o ELEMENTUM com HTTPS.
# Uso, dentro do servidor:  sudo bash magalu-setup.sh
# Pode rodar de novo para atualizar o jogo para a versão mais nova.
set -euo pipefail

DOMINIO="jogaelementum.com.br"
REPO="https://github.com/Enzooouu/jogo.git"
RAMO="ccr-6e31818c-9wsqg8"
PASTA="/opt/elementum"
DADOS="/var/lib/elementum"   # banco de dados (contas) fica aqui e não se perde

# 1) Node.js 22 e Caddy (o Caddy cuida do HTTPS sozinho, com Let's Encrypt)
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gpg git
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
fi

# 2) Usuário só do jogo (não roda como administrador)
id elementum >/dev/null 2>&1 || useradd --system --home "$PASTA" --shell /usr/sbin/nologin elementum
mkdir -p "$DADOS" && chown elementum:elementum "$DADOS"

# 3) Baixa (ou atualiza) o jogo
if [ -d "$PASTA/.git" ]; then
  git -C "$PASTA" fetch origin "$RAMO" && git -C "$PASTA" reset --hard "origin/$RAMO"
else
  git clone --branch "$RAMO" "$REPO" "$PASTA"
fi
cd "$PASTA" && npm ci --omit=dev
chown -R elementum:elementum "$PASTA"

# 4) O jogo como serviço (liga sozinho quando o servidor reinicia)
cat > /etc/systemd/system/elementum.service <<UNIT
[Unit]
Description=ELEMENTUM
After=network.target

[Service]
User=elementum
WorkingDirectory=$PASTA
Environment=NODE_ENV=production PORT=3000 DB_PATH=$DADOS/brawl.db TRUST_PROXY=1
ExecStart=/usr/bin/node server/index.js
Restart=always

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now elementum
systemctl restart elementum

# 5) HTTPS para o domínio (www vai para o endereço sem www)
cat > /etc/caddy/Caddyfile <<CADDY
$DOMINIO {
  encode gzip
  # ninguém pode fingir outro IP (o limite de tentativas usa o IP)
  reverse_proxy localhost:3000 {
    header_up -Cf-Connecting-Ip
  }
}
www.$DOMINIO {
  redir https://$DOMINIO{uri} permanent
}
CADDY
systemctl reload caddy || systemctl restart caddy

# 6) Firewall: só SSH, HTTP e HTTPS
if command -v ufw >/dev/null; then
  ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
fi

echo "Pronto! Abra https://$DOMINIO (o HTTPS pode levar 1 minuto na primeira vez)."
