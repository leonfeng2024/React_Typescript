# React_Typescript
React_Typescript

# local run 
npm start 

# local deploy command
npm run build
sudo cp nginx.conf /usr/local/etc/nginx/servers/bot-ui.conf && sudo nginx -s reload

# local update container command
./update_container.sh        # Build and update (default)
./update_container.sh -r     # Build, update, and restart container
./update_container.sh -s     # Skip build, just update container with existing build files