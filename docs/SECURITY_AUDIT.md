# TARCOIN Ecosystem — Security Audit & Mitigation Plan

> **Scope:** ElectrumX server, TARCOIN mobile wallet, tarcoind node, deployment infrastructure.
> **Standard:** Follows Bitcoin security best practices adapted for TARCOIN specifics.

---

## 1. Key Management

### 1.1 Mobile Wallet — Seed Phrase Generation

| Check | Requirement | Status |
|---|---|---|
| Entropy source | OS CSPRNG only (`SecRandomCopyBytes` iOS / `SecureRandom` Android) | ✅ BlueWallet compliant |
| Entropy size | Minimum 128 bits (12 words) / 256 bits (24 words) | ✅ BIP39 standard |
| Seed never transmitted | Seed and private keys never leave the device | ✅ |
| Seed never logged | No seed/key material in any log, crash report, or analytics | ✅ Must verify in production builds |
| Memory zeroing | Key material cleared from RAM after use | ⚠️ Review React Native memory model |

**Action required:**
- Audit all console.log() statements — confirm zero key material in logs
- Disable Sentry / Crashlytics for wallet-related screens in production

### 1.2 Mobile Wallet — Key Storage

| Platform | Storage | Encryption |
|---|---|---|
| iOS | Keychain (`kSecClassGenericPassword`) | AES-256, hardware-backed on devices with Secure Enclave |
| Android | Android Keystore (hardware-backed on API 28+) | AES-256-GCM |

**Action required:**
- Set `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` on iOS (prevents iCloud backup of keys)
- Set `setUserAuthenticationRequired(true)` on Android Keystore (requires biometric/PIN)
- Test backup/restore flow — wallet.dat must NOT be included in iOS/Android cloud backup

### 1.3 ElectrumX — No Private Keys

ElectrumX is a **public read server**. It holds:
- Block headers index
- Transaction index
- UTXO set (derived from tarcoind)

It does **NOT** hold private keys, seeds, or wallet files. ✅

### 1.4 tarcoind — Wallet Security

> [!CAUTION]
> If running `tarcoind` with a loaded wallet for the treasury or mining, the wallet.dat must be protected.

| Check | Action |
|---|---|
| RPC only on loopback | `rpcbind=127.0.0.1` — never expose 19332 to internet |
| Strong RPC password | 32+ character random string |
| Wallet encryption | `tarcoin-cli encryptwallet "strong_passphrase"` |
| Wallet backup | Regular encrypted backups of `wallet.dat` |
| `walletpassphrase` timeout | Set shortest acceptable unlock time |

---

## 2. Network Security

### 2.1 ElectrumX Transport

| Check | Requirement | Action |
|---|---|---|
| TLS version | TLS 1.2 minimum, TLS 1.3 preferred | Configured in nginx (`ssl_protocols TLSv1.2 TLSv1.3`) |
| Cipher suites | HIGH:!aNULL:!MD5 | Configured in nginx |
| Certificate | Let's Encrypt or CA-signed | `scripts/setup_ssl.sh` |
| Certificate auto-renewal | Certbot cron | Configured in `setup_ssl.sh` |
| Plaintext port 50001 | LAN/internal only — never expose to internet | UFW rule: no external 50001 |
| HSTS | `Strict-Transport-Security: max-age=31536000` | Configured in nginx |

### 2.2 tarcoind RPC Exposure

> [!CAUTION]
> **NEVER expose port 19332 (tarcoind RPC) to the internet.**
> The RPC interface has no rate limiting and accepts any command if authenticated.

```bash
# Verify RPC is not externally reachable
sudo ufw status | grep 19332   # Must show no rule
netstat -tlnp | grep 19332     # Must show 127.0.0.1:19332 only
```

### 2.3 P2P Port (19333)

Port 19333 must be open for TARCOIN network peers. This is safe — it uses the TARCOIN P2P protocol with magic bytes `74 61 72 63`.

```bash
sudo ufw allow 19333/tcp comment "TARCOIN P2P"
```

### 2.4 DDoS Mitigation

| Layer | Mitigation | Configuration |
|---|---|---|
| ElectrumX | `MAX_SESSIONS=1000`, `BANDWIDTH_LIMIT=2000000`, `SESSION_TIMEOUT=600` | `electrumx_mainnet.conf` |
| nginx | Rate limiting (`limit_req_zone`) | Add to nginx config |
| OS | `ufw` firewall | Configured in `install.sh` |
| Cloud | Cloudflare TCP proxy (optional) | Manual setup |

**Add to nginx config for basic rate limiting:**
```nginx
limit_conn_zone $binary_remote_addr zone=electrumx_conn:10m;
limit_conn electrumx_conn 5;   # max 5 concurrent connections per IP
```

---

## 3. Server Hardening

### 3.1 Operating System

```bash
# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# SSH hardening
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
# Set: PubkeyAuthentication yes
sudo systemctl restart ssh

# Fail2ban — block brute force
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
```

### 3.2 systemd Service Hardening

The provided `electrumx-tarcoin.service` already includes:

```ini
PrivateTmp=true           # Isolated /tmp
PrivateDevices=true       # No /dev access
ProtectSystem=full        # Read-only system dirs
ProtectHome=true          # No /home access
NoNewPrivileges=true      # Cannot gain elevated privileges
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
```

### 3.3 Docker Security

```bash
# Run containers as non-root (already configured in Dockerfile)
# Verify:
docker exec electrumx-server whoami   # Must return: electrumx

# No privileged containers
# Verify docker-compose.yml has no: privileged: true

# Read-only config mounts
# Verified: all config files mounted with :ro in docker-compose.yml
```

---

## 4. Mobile Wallet Security

### 4.1 Certificate Pinning

> [!IMPORTANT]
> For production, pin the SSL certificate of `electrum.tarcoin.org` in the mobile app.
> This prevents MITM attacks on the Electrum connection.

In BlueWallet, add to the ElectrumClient connection setup:
```javascript
// Pin the server certificate fingerprint
const PINNED_CERT_FINGERPRINT = 'SHA256:xxxx...';  // Get from: openssl x509 -fingerprint -sha256
```

### 4.2 Jailbreak / Root Detection

BlueWallet includes basic jailbreak detection. Verify it is enabled and triggers a warning.

### 4.3 Screen Recording Protection

```javascript
// iOS — prevent screenshot in sensitive screens (seed phrase display)
import { MaskedView } from '@react-native-masked-view/masked-view';
// Android — add FLAG_SECURE to seed display activity
```

### 4.4 Clipboard Security

Clear clipboard after copying address or seed phrase:
```javascript
// Clear after 60 seconds
setTimeout(() => Clipboard.setString(''), 60000);
```

---

## 5. Incident Response

### 5.1 If ElectrumX Server Is Compromised

1. **Immediately:** Take the server offline — remove from DNS
2. ElectrumX holds **no private keys** — no funds at risk from server breach
3. Users' wallets are unaffected — they connect to backup servers
4. Rebuild from scratch using this repository
5. Rotate RPC credentials on tarcoind

### 5.2 If tarcoind RPC Password Is Leaked

1. Stop tarcoind immediately
2. Change `rpcpassword` in `tarcoin.conf`
3. Restart tarcoind
4. Update `DAEMON_URL` in ElectrumX config and restart ElectrumX

### 5.3 If Mobile Wallet Seed Is Compromised

1. Immediately sweep all funds to a new wallet
2. Destroy the compromised device or remote-wipe
3. Do not reuse the compromised seed

---

## 6. Security Checklist — Pre-Launch

- [ ] RPC port 19332 not externally reachable (`netstat` verify)
- [ ] Electrum plaintext port 50001 not externally reachable
- [ ] TLS 1.2+ only — no TLS 1.0/1.1
- [ ] Let's Encrypt certificate installed and auto-renewing
- [ ] tarcoind RPC password is 32+ random characters
- [ ] ElectrumX running as non-root user `electrumx`
- [ ] SSH password auth disabled
- [ ] Automatic OS security updates enabled
- [ ] Fail2ban running
- [ ] Mobile wallet: no seed/key material in logs (manual test)
- [ ] Mobile wallet: keys stored in platform Keychain/Keystore
- [ ] Mobile wallet: iCloud/Google backup excludes wallet data
- [ ] Mobile wallet: certificate pinning implemented
- [ ] Wallet.dat encrypted (`tarcoin-cli encryptwallet`)
- [ ] Regular wallet.dat backups to offline storage
