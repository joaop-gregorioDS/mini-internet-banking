# Deploy na VPS

Este guia assume uma VPS **compartilhada**: o Nginx do host já atende outros sites da Vortex (cada um em um arquivo de `/etc/nginx/sites-enabled/`) e vários containers já estão rodando. Por isso o deploy só **adiciona** um site novo e não mexe nos existentes.

Arquitetura em produção:

```
Internet ──443 (HTTPS)──► Nginx do host (já existente; SSL Let's Encrypt; rate limit em /api/auth)
                               │
                               ▼  127.0.0.1:4201
                          container web (nginx + SPA)
                               │  /api, /health, /swagger
                               ▼  rede interna do Compose
                          container api (.NET 8) ──► container db (SQL Server 2022)
```

A porta 4201 fica presa em `127.0.0.1`, e a API e o banco não publicam porta nenhuma. A VPS já tem Nginx e firewall configurados: não é preciso instalá-los nem ativá-los de novo.

> Dados fictícios. O reset diário às 03h (horário de São Paulo) apaga contas e transferências criadas pelos visitantes e restaura o saldo do usuário demo.

## Pré-requisitos

- **DNS:** registro `A` de `mini-banking.vortexsoftware.tech` apontando para o IP da VPS. Hoje o subdomínio não resolve; crie o registro antes da etapa 4.
- Portas 80 e 443 já abertas (o Nginx atual já as usa).
- Porta 4201 livre no host (confirmado: não está em uso).

## 1. Baixar o projeto e criar o `.env`

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

## 2. Subir os containers

```bash
cd /opt/mini-internet-banking/app
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps       # db, api e web devem estar "healthy"
curl -s http://127.0.0.1:4201/health               # via proxy do container web
```

Os containers do projeto se chamam `mini-internet-banking-*`, então não colidem com os outros da VPS.

## 3. Certificado SSL e site no Nginx do host

O bloco HTTPS do arquivo `deploy/nginx/mini-banking.conf` usa certificados que ainda não existem. Por isso a primeira ativação usa só o bloco HTTP (linhas 1 a 22), que serve o desafio do Let's Encrypt.

```bash
sudo mkdir -p /var/www/certbot

# 1) Ativa só o bloco HTTP (sem o SSL) para o desafio funcionar
sed -n '1,22p' deploy/nginx/mini-banking.conf | sudo tee /etc/nginx/sites-available/mini-banking.conf > /dev/null
sudo ln -sf /etc/nginx/sites-available/mini-banking.conf /etc/nginx/sites-enabled/mini-banking.conf
sudo nginx -t && sudo systemctl reload nginx

# 2) Emite o certificado
sudo certbot certonly --webroot -w /var/www/certbot -d mini-banking.vortexsoftware.tech --agree-tos -m SEU-EMAIL

# 3) Troca pelo arquivo completo (HTTP redireciona para HTTPS + bloco 443)
sudo cp deploy/nginx/mini-banking.conf /etc/nginx/sites-available/mini-banking.conf
sudo nginx -t && sudo systemctl reload nginx
```

Não remova nem altere os outros arquivos de `sites-enabled/`. O `nginx -t` valida tudo antes do reload, então um erro não derruba os outros sites.

A renovação do certificado é automática (timer do `certbot`). Confira com `sudo certbot renew --dry-run`.

## 4. Verificar

- `https://mini-banking.vortexsoftware.tech` abre a tela de login.
- O botão "Entrar como Visitante" funciona.
- `https://mini-banking.vortexsoftware.tech/swagger` mostra a documentação da API.
- `https://mini-banking.vortexsoftware.tech/health` responde `Healthy`.
- Os outros sites continuam respondendo normalmente.

## Atualizar a versão

```bash
cd /opt/mini-internet-banking/app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Se a versão mudar, troque a tag `1.0.0` das imagens no `docker-compose.prod.yml` antes do build.

## Logs

- **Containers:** `json-file` com `max-size: 10m` e `max-file: 3` em cada serviço. Ver: `docker compose -f docker-compose.prod.yml logs -f api`.
- **Nginx do host:** o `logrotate` do Ubuntu já rotaciona `/var/log/nginx/*.log` (compartilhado com os outros sites).

## Limites de memória

| Serviço | Limite | Motivo |
|---|---|---|
| db (SQL Server) | 2 GB | Mínimo recomendado pelo SQL Server 2022 em Linux |
| api | 512 MB | Suficiente para o .NET 8 com esta carga |
| web | 64 MB | Nginx servindo arquivos estáticos |

A VPS tem 15 GB de RAM, com cerca de 10 GB disponíveis hoje, então a folga cabe.

## Dados

Os dados ficam no volume Docker `dbdata`. Como são fictícios e voltam ao estado inicial todo dia às 03h, não há rotina de backup configurada.
