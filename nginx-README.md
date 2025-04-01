# Nginx 配置说明

本项目中的 `nginx.conf` 文件提供了将 `/` 路径代理到项目 build 目录的配置。

## 使用方法

### 方法一：使用项目中的配置文件

1. 将 `nginx.conf` 文件复制到 Nginx 配置目录：

```bash
# MacOS (如果使用 Homebrew 安装的 Nginx)
sudo cp nginx.conf /usr/local/etc/nginx/servers/bot-ui.conf
# 或
sudo cp nginx.conf /opt/homebrew/etc/nginx/servers/bot-ui.conf

# Linux
sudo cp nginx.conf /etc/nginx/conf.d/bot-ui.conf

# Windows
copy nginx.conf C:\nginx\conf\conf.d\bot-ui.conf
# 或
copy nginx.conf "C:\Program Files\nginx\conf\conf.d\bot-ui.conf"
```

2. 测试并重启 Nginx：

```bash
# MacOS/Linux
sudo nginx -t
sudo nginx -s reload

# Windows (以管理员权限运行命令提示符或PowerShell)
cd C:\nginx
# 或
cd "C:\Program Files\nginx"
nginx -t
nginx -s reload
```

### 方法二：在主配置文件中包含此配置

1. 打开 Nginx 主配置文件：

```bash
# MacOS (Homebrew)
sudo nano /usr/local/etc/nginx/nginx.conf
# 或
sudo nano /opt/homebrew/etc/nginx/nginx.conf

# Linux
sudo nano /etc/nginx/nginx.conf

# Windows (以管理员权限运行)
notepad C:\nginx\conf\nginx.conf
# 或
notepad "C:\Program Files\nginx\conf\nginx.conf"
```

2. 在 `http` 块中添加：

```
include /path/to/your/project/nginx.conf;  # MacOS/Linux
include C:/path/to/your/project/nginx.conf;  # Windows
```

3. 保存并重启 Nginx：

```bash
# MacOS/Linux
sudo nginx -t
sudo nginx -s reload

# Windows (以管理员权限运行)
nginx -t
nginx -s reload
```

## 访问应用

配置完成后，通过以下URL访问应用：

```
http://localhost/
```

## Windows 特别说明

在 Windows 系统上，您可能需要额外执行以下步骤：

1. 安装 Nginx：
   - 从 [Nginx 官网](http://nginx.org/en/download.html) 下载 Windows 版本
   - 解压到 C:\nginx 或安装到 C:\Program Files\nginx

2. Nginx 服务管理（以管理员权限运行命令提示符或PowerShell）：
   ```
   # 启动 Nginx
   start nginx
   # 或
   C:\nginx\nginx.exe
   
   # 停止 Nginx
   nginx -s stop
   
   # 重新加载配置
   nginx -s reload
   
   # 查看 Nginx 进程
   tasklist /fi "imagename eq nginx.exe"
   ```

3. 调整文件路径：
   - 在 Windows 中，请使用正斜杠 `/` 或双反斜杠 `\\` 作为路径分隔符
   - 例如：`C:/nginx/html` 或 `C:\\nginx\\html`

4. 权限问题：
   - 如果遇到权限问题，请确保运行 Nginx 的用户对 build 目录有读取权限
   - 可以在资源管理器中右键点击目录 -> 属性 -> 安全 -> 编辑，添加对应用户的读取权限

## 注意事项

- 确保 Nginx 用户有权限读取构建目录 `/Users/fengliang/GitHub/bot-ui/React_Typescript/build/`
- 如果遇到 403 Forbidden 错误，可能需要调整目录权限
- 此配置适用于 React 单页应用，使用 `try_files` 确保客户端路由正常工作 