# 🚀 Quick Deploy Guide - VMP API

## Bước 1: Pull Code Mới Trên VPS

```bash
cd /opt/vmp-api
git pull origin main
```

## Bước 2: Rebuild & Restart Containers

```bash
bash deploy.sh
```

**Chờ vài phút để tất cả containers khởi động. Nếu thành công, bạn sẽ thấy:**

```
✓ MongoDB is running ✓
✓ Checking API health...
✓ API is healthy!
```

## Bước 3: Verify API Đang Chạy

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check API logs
docker-compose -f docker-compose.prod.yml logs api --tail 50

# Test API
curl http://localhost:3000/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```

## Bước 4: Setup SSL (Tùy chọn nhưng khuyến khích)

### Yêu cầu:
1. ✅ Domain đã trỏ DNS về IP VPS của bạn
2. ✅ Port 80 và 443 đã mở trong firewall

### Chạy SSL Setup:

```bash
cd /opt/vmp-api
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

Script sẽ hỏi:
- **Domain name**: Ví dụ `api.yourdomain.com`
- **Email**: Email của bạn để nhận thông báo từ Let's Encrypt

**Quá trình sẽ:**
1. Cài đặt Certbot
2. Dừng Nginx tạm thời
3. Lấy SSL certificate từ Let's Encrypt
4. Cập nhật Nginx config
5. Khởi động lại Nginx với SSL
6. Setup auto-renewal (mỗi ngày lúc 3 AM)

### Sau khi xong:

```bash
# Test SSL
curl https://yourdomain.com/health

# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx --tail 50
```

## Bước 5: Access Your API

### HTTP (Nếu chưa có SSL):
```
http://your-vps-ip:3000/api/v1
http://your-vps-ip:3000/docs
```

### HTTPS (Sau khi setup SSL):
```
https://yourdomain.com/api/v1
https://yourdomain.com/docs
```

### Mongo Express (Database GUI):
```
http://your-vps-ip:8081
```
- Username: `admin` (từ ME_USERNAME trong .env.production)
- Password: (từ ME_PASSWORD trong .env.production)

## Troubleshooting

### API Container Keeps Restarting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api --tail 100

# Common issues:
# 1. MongoDB connection failed -> Check MONGO_URI in .env.production
# 2. Redis connection failed -> Check REDIS_HOST in .env.production
# 3. Schema errors -> Should be fixed now with latest code
```

### Nginx Can't Start

```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# If SSL error:
# 1. Make sure you ran setup-ssl.sh
# 2. Check certificates exist: ls -la /opt/vmp-api/docker/ssl/
# 3. Restart nginx: docker-compose -f docker-compose.prod.yml restart nginx
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo

# Connect to MongoDB shell
docker exec -it vmp-mongo-prod mongosh -u admin -p YOUR_PASSWORD

# Inside MongoDB shell:
show dbs
use vmp-production
show collections
```

### Environment Variables Not Loading

```bash
# Make sure .env.production exists
ls -la /opt/vmp-api/.env.production

# Source it manually
source /opt/vmp-api/.env.production
echo $MONGO_ROOT_PASSWORD  # Should show your password
```

## Useful Commands

### View All Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart a Specific Service
```bash
docker-compose -f docker-compose.prod.yml restart api
docker-compose -f docker-compose.prod.yml restart nginx
docker-compose -f docker-compose.prod.yml restart mongo
```

### Stop All Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Start All Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Rebuild API Container
```bash
docker-compose -f docker-compose.prod.yml build api --no-cache
docker-compose -f docker-compose.prod.yml up -d api
```

### Check Resource Usage
```bash
docker stats
```

### Clean Up Old Images/Volumes
```bash
docker system prune -a --volumes
# WARNING: This will remove ALL unused images and volumes!
```

## Security Checklist

- [ ] Changed all default passwords in `.env.production`
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSH key authentication enabled (password disabled)
- [ ] SSL certificates installed
- [ ] Regular backups configured for MongoDB
- [ ] Monitoring/alerts setup

## Performance Tips

1. **MongoDB Indexes**: Already created automatically
2. **Redis Caching**: Make sure Redis is running
3. **Nginx Caching**: Enabled by default
4. **Rate Limiting**: Configured in Nginx (100 req/s)
5. **Gzip Compression**: Enabled by default

## Need Help?

Check the full documentation:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `API_DOCUMENTATION.md` - API endpoints documentation
- `README.md` - Project overview

---

**Last Updated:** November 5, 2025

