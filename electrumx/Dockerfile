# =============================================================================
# ElectrumX TARCOIN — Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1: Clone and patch ElectrumX with TARCOIN coin class
#   Stage 2: Minimal production runtime image
#
# Build: docker build -t electrumx-tarcoin .
# Run:   docker-compose up -d
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder — clone ElectrumX and apply TARCOIN patch
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

LABEL maintainer="tarcoin-dev"
LABEL description="ElectrumX server patched for TARCOIN (TAR)"

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Clone ElectrumX (pinned to a known-good commit for reproducibility)
# Update this SHA periodically after testing
RUN git clone https://github.com/spesmilo/electrumx.git . \
    && git checkout master

# Install Python dependencies
RUN pip install --no-cache-dir --prefix=/install \
    aiohttp \
    aiorpcx \
    attrs \
    pylru \
    plyvel

# Apply TARCOIN coin class patch
# Insert TarCoin and TarCoinTestnet classes into coins.py
COPY coins_tarcoin.py /build/coins_tarcoin.py
COPY scripts/apply_patch.py /build/apply_patch.py
RUN python apply_patch.py

# ---------------------------------------------------------------------------
# Stage 2: Production runtime image
# ---------------------------------------------------------------------------
FROM python:3.12-slim

LABEL maintainer="tarcoin-dev"
LABEL description="ElectrumX TARCOIN (TAR) — Production Runtime"

# Install LevelDB runtime dependency
RUN apt-get update && apt-get install -y \
    libleveldb-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy patched ElectrumX source
COPY --from=builder /build /electrumx

WORKDIR /electrumx

# Create non-root user for security
RUN groupadd -r electrumx && useradd -r -m -g electrumx electrumx

# Create data directory
RUN mkdir -p /data/electrumx && \
    mkdir -p /etc/ssl/electrumx && \
    chown -R electrumx:electrumx /data/electrumx /etc/ssl/electrumx

# ElectrumX ports:
#   50001 — TCP Electrum protocol (plaintext)
#   50002 — SSL Electrum protocol (TLS)
#   50004 — WebSocket TLS
EXPOSE 50001 50002 50004

VOLUME ["/data/electrumx", "/etc/ssl/electrumx"]

USER electrumx

# Health check — verify ElectrumX is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import socket; s=socket.create_connection(('127.0.0.1',50001),5); s.close()" || exit 1

ENTRYPOINT ["python", "electrumx_server"]
