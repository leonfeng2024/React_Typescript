# 第一阶段：构建React应用
FROM crpi-5va2c7blqnzmwnnn.cn-beijing.personal.cr.aliyuncs.com/aacoe/local_platform:node18-alpine-amd as builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：配置Nginx服务器
FROM nginx:alpine

# 复制构建产物到Nginx目录
COPY --from=builder /app/build /usr/share/nginx/html

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 8080

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]