#!/bin/bash

# config output color
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# print message with color
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed, please install Node.js and npm first"
    exit 1
fi

# check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "nginx is not installed, please install nginx first"
    exit 1
fi

# get nginx html directory path
NGINX_HTML_DIR="/usr/local/var/www/html"

# check if nginx html directory exists
if [ ! -d "$NGINX_HTML_DIR" ]; then
    print_error "Nginx html directory does not exist: $NGINX_HTML_DIR"
    print_message "Please confirm the installation path of nginx and modify the NGINX_HTML_DIR variable in the script"
    exit 1
fi

# start building
print_message "Start building project..."
npm run build

# check if build is successful
if [ $? -ne 0 ]; then
    print_error "Project build failed"
    exit 1
fi

# backup existing html directory content (if exists)
if [ -d "$NGINX_HTML_DIR" ] && [ "$(ls -A $NGINX_HTML_DIR)" ]; then
    print_message "Backup existing html directory content..."
    BACKUP_DIR="$NGINX_HTML_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    mv "$NGINX_HTML_DIR"/* "$BACKUP_DIR" 2>/dev/null
fi

# deploy build files to nginx html directory
print_message "Deploying to Nginx..."
cp -r build/* "$NGINX_HTML_DIR"

# check if copy is successful
if [ $? -eq 0 ]; then
    print_message "Deployment successful!"
    print_message "Website deployed to: $NGINX_HTML_DIR"
else
    print_error "Deployment failed, please check permissions or disk space"
    exit 1
fi

# restart nginx
print_message "Restarting Nginx..."
sudo nginx -s reload

if [ $? -eq 0 ]; then
    print_message "Nginx restarted successfully!"
else
    print_error "Nginx restart failed, please restart manually"
fi 