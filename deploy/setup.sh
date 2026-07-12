#!/bin/bash
# Arambhika Web — One-time server setup script
# Run this on a fresh Ubuntu 22.04 DigitalOcean Droplet as root
# Usage: bash setup.sh

set -e

echo "=== Arambhika Web Server Setup ==="
echo ""

# 1. Update system
apt-get update -y && apt-get upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install PM2 (process manager — keeps app running)
npm install -g pm2

# 4. Install Nginx
apt-get install -y nginx

# 5. Install certbot for free SSL
apt-get install -y certbot python3-certbot-nginx

# 6. Create app directory
mkdir -p /var/www/arambhika
mkdir -p /var/www/arambhika/data

# 7. Clone the repo (replace with your actual repo URL)
echo ""
read -p "Enter your GitHub repo URL (e.g. https://github.com/saurabh257257/arambhika-web.git): " REPO_URL
git clone "$REPO_URL" /var/www/arambhika/app

cd /var/www/arambhika/app

# 8. Create .env.local
echo ""
echo "=== Setting up environment variables ==="
read -p "Admin username [admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -s -p "Admin password: " ADMIN_PASS
echo ""
read -p "Your domain (e.g. arambhikaenablers.in): " DOMAIN

SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env.local << EOF
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS
SESSION_SECRET=$SESSION_SECRET
SITE_URL=https://$DOMAIN
NEXT_PUBLIC_WHATSAPP_NUMBER=919315545821
DB_PATH=/var/www/arambhika/data/arambhika.db
EOF

echo ".env.local created"

# 9. Install dependencies and build
npm install
npm run build

# 10. Set up PM2
pm2 start npm --name "arambhika" -- start
pm2 startup systemd -u root --hp /root
pm2 save

# 11. Nginx config
cat > /etc/nginx/sites-available/arambhika << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/arambhika /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 12. SSL
echo ""
echo "=== Setting up SSL (free HTTPS via Let's Encrypt) ==="
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "info@arambhikaenablers.in"

echo ""
echo "=== DONE! ==="
echo "Site is live at: https://$DOMAIN"
echo "Admin panel:     https://$DOMAIN/admin"
echo ""
echo "To update the site later, run: bash /var/www/arambhika/app/deploy/update.sh"
