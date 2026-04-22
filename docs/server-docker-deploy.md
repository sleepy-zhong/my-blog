# 鏈嶅姟鍣?Docker 閮ㄧ讲璇存槑

杩欎唤璇存槑瀵瑰簲褰撳墠浠撳簱鐨勭敓浜ч儴缃叉柟寮忥細

- 浠ｇ爜鍏堟帹鍒?GitHub
- 鏈嶅姟鍣?`git pull`
- 鏈嶅姟鍣ㄦ湰鍦?`docker compose build`
- 瀹夸富鏈?Nginx 缁х画淇濈暀 `sleepyzhong.top` 绔欑偣閰嶇疆锛屽苟璐熻矗锛?  - `443` HTTPS 鍏ュ彛
  - Xray WebSocket 浼娴侀噺杞彂
  - 鍗氬鍓嶅悗绔弽鍚戜唬鐞?
## 1. 褰撳墠閮ㄧ讲缁撴瀯

- 瀹夸富鏈?Nginx锛?  - 瀵瑰鏆撮湶 `80/443`
  - `/_cfws_9f3a2d` 杞彂鍒板涓绘満 `127.0.0.1:10002`
  - `/api/` 涓?`/uploads/` 杞彂鍒?Docker 涓殑 backend
  - `/`銆乣/blogs`銆乣/assets/` 杞彂鍒?Docker 涓殑 frontend
- Docker Compose锛?  - `mysql` -> `127.0.0.1:3306`
  - `redis` -> `127.0.0.1:6380`
  - `backend` -> `127.0.0.1:3000`
  - `frontend` -> `127.0.0.1:10001`

澶栫綉鍙渶瑕佹斁琛?`80/443`銆俙3000/3306/6380/10001/10002` 閮藉簲淇濇寔瀹夸富鏈烘湰鍦拌闂€?
## 2. 浠撳簱閲岄渶瑕佷娇鐢ㄧ殑鏂囦欢

- `docker-compose.yml`锛氱敓浜х紪鎺掓枃浠?- `backend/backend/Dockerfile`锛氬悗绔暅鍍?- `fontend/Dockerfile`锛氬墠绔暅鍍?- `fontend/nginx.conf`锛氬墠绔鍣ㄥ唴 Nginx
- `nginx.conf`锛氬涓绘満绔欑偣閰嶇疆鏂囦欢锛屽簲閮ㄧ讲鍒?`/etc/nginx/sites-available/sleepyzhong.top`
- `.env.production`锛氱敓浜х幆澧冨彉閲?- `my.cnf`锛歁ySQL 浣庡唴瀛橀厤缃?- `scripts/deploy-prod.sh`锛氭湇鍔″櫒鏇存柊鑴氭湰

娉ㄦ剰锛氫粨搴撴牴鐩綍鐨?`nginx.conf` 鏄珯鐐归厤缃紝涓嶆槸瀹夸富鏈轰富閰嶇疆鏂囦欢銆備笉瑕佹嬁瀹冭鐩?`/etc/nginx/nginx.conf`銆?
## 3. 棣栨閮ㄧ讲

### 3.1 鏈嶅姟鍣ㄥ噯澶?
纭繚鏈嶅姟鍣ㄥ凡瀹夎锛?
- `git`
- `docker`
- Docker Compose 鎻掍欢
- `nginx`
- `certbot`锛堝鏋滆瘉涔﹁繕娌＄鍙戯級

### 3.2 鎷変唬鐮?
```bash
cd /opt
git clone <浣犵殑浠撳簱鍦板潃> my-blog
cd /opt/my-blog
```

### 3.3 閰嶇疆鐜鍙橀噺

浠ヤ粨搴撲腑鐨勬ā鏉夸负鍩虹锛?
```bash
cp .env.production.example .env.production
```

鐒跺悗鑷冲皯纭杩欎簺鍊硷細

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `SMTP_*`
- `PUBLIC_SITE_URL=https://sleepyzhong.top`
- `PUBLIC_API_URL=https://sleepyzhong.top/api`
- `CORS_ALLOWED_ORIGINS=https://sleepyzhong.top,https://www.sleepyzhong.top`

### 3.4 閮ㄧ讲瀹夸富鏈?Nginx 绔欑偣鏂囦欢

```bash
sudo cp /opt/my-blog/nginx.conf /etc/nginx/sites-available/sleepyzhong.top
sudo ln -sf /etc/nginx/sites-available/sleepyzhong.top /etc/nginx/sites-enabled/sleepyzhong.top
sudo nginx -t
sudo systemctl reload nginx
```

如果你保留仓库里现在这份 `www.sleepyzhong.top -> sleepyzhong.top` 的 443 跳转配置，请确认当前证书也包含 `www.sleepyzhong.top`。

濡傛灉浣犲凡缁忔湁鏃х増 `sleepyzhong.top` 閰嶇疆锛屽厛澶囦唤锛?
```bash
sudo cp /etc/nginx/sites-available/sleepyzhong.top /etc/nginx/sites-available/sleepyzhong.top.bak
```

### 3.5 Xray 瀵归綈椤?
褰撳墠浠撳簱閲岀殑瀹夸富鏈?Nginx 閰嶇疆瑕佹眰 Xray 婊¤冻锛?
- 鐩戝惉瀹夸富鏈?`127.0.0.1:10002`
- WebSocket 璺緞鏄?`/_cfws_9f3a2d`

濡傛灉 Xray 鐨勬湰鍦扮鍙ｆ垨璺緞涓嶅悓锛屽繀椤诲悓姝ユ敼浠撳簱鏍圭洰褰?`nginx.conf`銆?
### 3.6 鏋勫缓骞跺惎鍔ㄥ鍣?
```bash
cd /opt/my-blog
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

涔熷彲浠ユ墜宸ユ墽琛岋細

```bash
docker compose build backend
docker compose build frontend
docker compose up -d mysql redis backend frontend
docker compose ps
```

## 4. 鏃ュ父鏇存柊

```bash
cd /opt/my-blog
git pull
./scripts/deploy-prod.sh
```

鏌ョ湅鏃ュ織锛?
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose logs -f redis
```

## 5. 鍥炴粴

### 5.1 Nginx 閰嶇疆鍥炴粴

```bash
sudo cp /etc/nginx/sites-available/sleepyzhong.top.bak /etc/nginx/sites-available/sleepyzhong.top
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 瀹瑰櫒鍥炴粴

鍥炴粴浠ｇ爜鍚庨噸鏂伴儴缃诧細

```bash
cd /opt/my-blog
git checkout <绋冲畾鎻愪氦>
./scripts/deploy-prod.sh
```

## 6. 褰撳墠 Compose 鐨勬寔涔呭寲绛栫暐

- MySQL锛欴ocker named volume `my-blog_db_data`
- 涓婁紶鏂囦欢锛欴ocker named volume `my-blog_uploads`
- Redis锛欴ocker named volume `my-blog_redis_data`

杩欐牱鍋氱殑濂藉鏄細

- 閲嶆柊 `git pull` 涓嶄細瑕嗙洊鏁版嵁
- 閲嶅缓瀹瑰櫒鏃舵暟鎹簱鍜屼笂浼犳枃浠惰繕鍦?- 涓嶄緷璧栭澶栨墜宸ュ垱寤?external volume

## 7. 鍏抽敭娉ㄦ剰浜嬮」

- 鍓嶇瀹瑰櫒鍙瀹夸富鏈烘毚闇?`127.0.0.1:10001`
- 鍚庣瀹瑰櫒鍙瀹夸富鏈烘毚闇?`127.0.0.1:3000`
- 瀹夸富鏈?Nginx 鎵嶆槸鍞竴澶栫綉鍏ュ彛
- 褰撳墠涓婁紶闄愬埗鎸?`5MB` 閰嶇疆锛屽涓绘満 Nginx 鍜屽墠绔鍣ㄥ唴 Nginx 閮借淇濇寔涓€鑷?- `ENABLE_ARTICLE_IMPORT=false`銆乣ENABLE_ATTACHMENT_ARCHIVE=false`銆乣ENABLE_ATTACHMENT_RECOMPRESS=false` 鏄綋鍓?2G 鏈哄櫒鐨勪繚瀹堜笂绾跨瓥鐣?
