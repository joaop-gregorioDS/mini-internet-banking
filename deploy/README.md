# Deploy na VPS

Arquitetura em produção:

```
Internet ──443 (HTTPS)──► Nginx do host (SSL Let's Encrypt, rate limit em /api/auth)
                               │
                               ▼  127.0.0.1:4201
                          container web (nginx + SPA)
                               │  /api, /health, /swagger
                               ▼  rede interna do Compose
                          container api (.NET 8) ──► container db (SQL Server 2022)
```

Só as portas 80 e 443 ficam abertas para a internet. A porta 4201 fica presa em `127.0.0.1`, e a API e o banco não publicam porta nenhuma.

> Dados fictícios. O reset diário às 03h (horário de São Paulo) apaga contas e transferências criadas pelos visitantes e restaura o saldo do usuário demo.

## Pré-requisitos

- VPS Ubuntu com Docker Engine e o plugin Compose instalados.
- Um domínio ou subdomínio apontando (registro `A`, e `AAAA` se a VPS tiver IPv6) para o IP da VPS.
- Portas 80 e 443 liberadas no firewall.

## 1. Preparar o servidor

```bash
sudo apt update && sudo apt install -y nginx certbot git
sudo ufw allow 'Nginx Full' && sudo ufw allow OpenSSH && sudo ufw enable
```

## 2. Baixar o projeto e criar o `.env`

```bash
sudo mkdir -p /opt/mini-internet-banking && sudo chown "$USER" /opt/mini-internet-banking
git clone https://github.com/joaop-gregorioDS/mini-internet-banking.git /opt/mini-internet-banking/app
cd /opt/mini-internet-banking/app
cp .env.example .env
nano .env   # preencha MSSQL_SA_PASSWORD (senha forte) e JWT_KEY (32+ caracteres aleatórios)
chmod 600 .env
```

Para gerar uma `JWT_KEY` aleatória: `openssl rand -base64 48`.

O `.env` nunca vai para o Git (está no `.gitignore`).

## 3. Subir os containers

```bash
cd /opt/mini-internet-banking/app
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps       # db, api e web devem estar "healthy"
curl -s http://127.0.0.1:4201/health               # via proxy do container web
```

## 4. Certificado SSL e Nginx do host

Troque `SEU_DOMINIO` pelo domínio real nos comandos abaixo.

```bash
# Pasta do desafio do Let's Encrypt
sudo mkdir -p /var/www/certbot

# Config HTTP inicial, para o certbot conseguir validar o domínio
sudo cp deploy/nginx/mini-banking.conf /etc/nginx/sites-available/mini-banking
sudo sed -i 's/SEU_DOMINIO/seu.dominio.com/g' /etc/nginx/sites-available/mini-banking
```

Antes de emitir o certificado, o bloco `443` ainda não tem arquivos de certificado. Por isso:

1. Comente temporariamente o bloco `server { listen 443 ... }` no arquivo de `sites-available`.
2. Ative o site e recarregue:

```bash
sudo ln -sf /etc/nginx/sites-available/mini-banking /etc/nginx/sites-enabled/mini-banking
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

3. Emita o certificado:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d seu.dominio.com --agree-tos -m seu-email@dominio.com
```

4. Descomente o bloco `443`, teste e recarregue:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

A renovação é automática (timer do `certbot`). Confira com `sudo certbot renew --dry-run`.

## 5. Verificar

- `https://seu.dominio.com` abre a tela de login.
- Botão "Entrar como Visitante" funciona.
- `https://seu.dominio.com/swagger` mostra a documentação da API.
- `https://seu.dominio.com/health` responde `Healthy`.

## Atualizar a versão

```bash
cd /opt/mini-internet-banking/app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Se a versão mudar, troque a tag `1.0.0` das imagens no `docker-compose.prod.yml` antes do build.

## Logs

- **Containers:** `json-file` com `max-size: 10m` e `max-file: 3` em cada serviço (até 30 MB por serviço). Ver: `docker compose -f docker-compose.prod.yml logs -f api`.
- **Nginx do host:** o pacote `logrotate` do Ubuntu já rotaciona `/var/log/nginx/*.log` todo dia.

## Limites de memória

| Serviço | Limite | Motivo |
|---|---|---|
| db (SQL Server) | 2 GB | Mínimo recomendado pelo SQL Server 2022 em Linux |
| api | 512 MB | Suficiente para o .NET 8 com esta carga |
| web | 64 MB | Nginx servindo arquivos estáticos |

## Dados

Os dados ficam no volume Docker `dbdata`. Como são fictícios e voltam ao estado inicial todo dia às 03h, não há rotina de backup configurada.
