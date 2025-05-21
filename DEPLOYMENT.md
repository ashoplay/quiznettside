# Deployment Guide

This document outlines how to deploy the Quiz application to the production servers.

## Server Configuration

- **Application Server IP**: 10.12.49.79
- **MongoDB Server IP**: 10.12.49.80

## Prerequisites

- Ubuntu 20.04 or later VM
- Node.js 16.x or later
- MongoDB 4.4 or later
- Nginx (for reverse proxy)

## Installation Steps

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. MongoDB Configuration (on 10.12.49.80)

If setting up the MongoDB server:

```bash
# On the MongoDB server (10.12.49.80)
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo apt install -y mongodb-org

# Configure MongoDB to listen on specific IP
sudo nano /etc/mongod.conf
# Change bindIp to 0.0.0.0 to allow external connections or specifically to 10.12.49.80

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use quiznettside
> db.createUser({user: "quizadmin", pwd: "secure_password", roles: [{role: "readWrite", db: "quiznettside"}]})
```

### 4. Application Setup (on 10.12.49.79)

On the application server:

```bash
# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Clone the Repository
git clone https://github.com/yourusername/quiz-nettside.git
cd quiz-nettside/quiz

# Install Dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
# Update environment variables with actual values
```

### 5. Configure Environment Variables

Update the `.env` file with the following content:

```
MONGODB_URI=mongodb://quizadmin:secure_password@10.12.49.80:27017/quiznettside
JWT_SECRET=your_strong_secret_key_here
PORT=3000
HOST=10.12.49.79
NODE_ENV=production
```

### 6. Configure PM2 for Process Management

```bash
sudo npm install -g pm2
pm2 start app.js --name "quiz-app"
pm2 startup
pm2 save
```

### 7. Configure Nginx as a Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/quiz-app
```

Add the following content:

```
server {
    listen 80;
    server_name 10.12.49.79;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Set Up SSL with Let's Encrypt (if you have a domain)

If you have a domain pointing to your server:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

- Check application logs: `pm2 logs quiz-app`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
- Test MongoDB connection: `mongo mongodb://10.12.49.80:27017/quiznettside`

## Maintenance

- Update application: 
  ```bash
  cd ~/quiz-nettside
  git pull
  npm install
  pm2 restart quiz-app
  ```

- Backup database:
  ```bash
  mongodump --host 10.12.49.80 --db quiznettside --out /backup/$(date +"%Y-%m-%d")
  ```

## Security Considerations

- Configure UFW or another firewall to restrict access to your servers
- On MongoDB server, allow connections only from 10.12.49.79
- Use strong passwords for the database and JWT secret
- Keep all systems updated with security patches
