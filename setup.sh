#!/bin/bash
set -e

REPO_URL="https://github.com/danilnagy/obp-scraper.git"
APP_DIR="/home/ubuntu/obp-scraper"

echo "Installing dependencies..."
sudo apt update
sudo apt install -y curl git build-essential

echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone or update the repo
if [ -d "$APP_DIR" ]; then
  echo "Directory $APP_DIR exists. Pulling latest changes..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "Installing packages with npm..."
npm install

npx playwright install-deps
npx playwright install

# Clean existing PM2 processes
pm2 delete all || true

echo "Starting scraper server..."
# You can replace this with pm2 or systemd if preferred
# nohup npm start > out.log 2>&1 &
# echo "Server started in background. Logs: $APP_DIR/out.log"

# Start the server using PM2
pm2 start server.js --name scrape-api -f
pm2 save
pm2 startup --hp ubuntu