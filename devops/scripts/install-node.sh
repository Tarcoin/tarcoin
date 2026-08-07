#!/bin/bash
# TARCOIN One-Click Node Installer
# Usage: curl -sL https://raw.githubusercontent.com/Tarcoin/tarcoin/master/devops/scripts/install-node.sh | bash
# This script installs Docker, clones the repository, configures secure random passwords, and starts the Tarcoin node.

set -e

echo "========================================================"
echo "          Tarcoin Node One-Click Installer              "
echo "========================================================"
echo ""

# 1. Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run this script as root (or use sudo)"
  exit 1
fi

# 2. Install dependencies (git, curl)
echo "⏳ Installing required dependencies..."
apt-get update -qq
apt-get install -y -qq git curl openssl

# 3. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "⏳ Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker is already installed."
fi

# 4. Install Docker Compose if not present
if ! docker compose version &> /dev/null; then
    echo "⏳ Installing Docker Compose..."
    apt-get install -y -qq docker-compose-plugin
fi

# 5. Setup Installation Directory
INSTALL_DIR="/opt/tarcoin"
echo "⏳ Setting up Tarcoin directory at $INSTALL_DIR..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Directory $INSTALL_DIR already exists. Updating repository..."
    cd $INSTALL_DIR
    git pull origin master -q
else
    git clone -q https://github.com/Tarcoin/tarcoin.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

# 6. Configure Environment Variables (.env)
cd docker
if [ ! -f .env ]; then
    echo "⏳ Generating secure random passwords for your node..."
    cp .env.example .env
    
    # Generate unique 32-character random passwords
    PG_PASS=$(openssl rand -hex 16)
    GRAFANA_PASS=$(openssl rand -hex 16)
    RPC_PASS=$(openssl rand -hex 16)

    # Replace placeholder passwords in the .env file with the secure ones
    sed -i "s/change_this_to_a_secure_password/$PG_PASS/g" .env
    sed -i "s/change_this_grafana_password/$GRAFANA_PASS/g" .env
    sed -i "s/change_this_rpc_password/$RPC_PASS/g" .env
    echo "✅ Passwords securely generated."
else
    echo "✅ .env file already exists. Skipping password generation."
fi

# 7. Start the Tarcoin Node
echo "⏳ Pulling latest Tarcoin Docker images..."
docker compose pull tarcoind -q

echo "🚀 Starting Tarcoin Node..."
# We ONLY start 'tarcoind' by default, not the full stack, to save server resources.
docker compose up -d tarcoind

echo ""
echo "========================================================"
echo "🎉 SUCCESS! Your Tarcoin Node is now running!"
echo "========================================================"
echo "Your node is automatically connecting to the network and"
echo "downloading the blockchain."
echo ""
echo "Useful Commands:"
echo "View Logs:       cd /opt/tarcoin/docker && docker compose logs -f tarcoind"
echo "Check Status:    cd /opt/tarcoin/docker && docker compose ps"
echo "Stop Node:       cd /opt/tarcoin/docker && docker compose down"
echo "========================================================"
