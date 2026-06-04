# TARCOIN — GitHub Secrets Setup Guide

Before CI/CD workflows can deploy and monitor, you must add these secrets to your
GitHub repository at: **Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_IP` | VPS / server IP address | `123.45.67.89` |
| `SERVER_USER` | SSH username | `deploy` |
| `SSH_PRIVATE_KEY` | Private key for SSH (full contents of `~/.ssh/id_rsa`) | `-----BEGIN...` |
| `DISCORD_WEBHOOK` | Discord webhook URL for alerts | `https://discord.com/api/webhooks/...` |

## Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | For S3 blockchain backups |
| `AWS_SECRET_ACCESS_KEY` | For S3 blockchain backups |
| `AWS_S3_BUCKET` | S3 bucket name for backups (e.g. `tarcoin-backups`) |

## How to Generate an SSH Key Pair

```bash
# On your local machine:
ssh-keygen -t ed25519 -C "tarcoin-deploy" -f ~/.ssh/tarcoin_deploy

# Copy public key to your server:
ssh-copy-id -i ~/.ssh/tarcoin_deploy.pub deploy@YOUR_SERVER_IP

# Add the PRIVATE key to GitHub Secrets (SSH_PRIVATE_KEY):
cat ~/.ssh/tarcoin_deploy
```

## How to Set Up a Discord Webhook

1. In Discord: go to Server Settings → Integrations → Webhooks → New Webhook
2. Give it a name like "TARCOIN Alerts"
3. Copy the webhook URL and add it as `DISCORD_WEBHOOK` secret

## Workflow Summary

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci-cd.yml` | Push to `main`/`develop` | Build, test, Docker publish |
| `deploy.yml` | GitHub Release or manual | SSH deploy + health check |
| `security.yml` | Push + weekly schedule | Gitleaks + npm audit + CodeQL |
| `release.yml` | Tag push `v*.*.*` | Create GitHub Release with changelog |
| `monitor.yml` | Every 15 minutes | Ping all services, alert on failure |

## First Deployment Checklist

```
[ ] Server has Docker + Docker Compose installed
[ ] DNS records point domains to server IP
[ ] SSL certificates obtained (run devops/scripts/ssl-setup.sh)
[ ] docker/.env created from docker/.env.example
[ ] All GitHub Secrets set above
[ ] SSH key deployed to server
[ ] git clone https://github.com/tarcoin/tarcoin.git /opt/tarcoin
[ ] Push a tag: git tag v1.0.0 && git push origin v1.0.0
```
