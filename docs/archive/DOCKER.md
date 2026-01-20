# 🐳 Docker Setup Guide - CHEFIAPP POS Core

Complete guide for containerizing and running the CHEFIAPP POS Core system with Docker.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services](#services)
- [Development](#development)
- [Production](#production)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🚀 Prerequisites

- **Docker Desktop** or Docker Engine 20.10+
- **Docker Compose** v2.0+
- **Stripe Account** (test mode keys)
- **8GB RAM** minimum for running all services

### Verify Installation

```bash
docker --version
docker compose version
```

---

## ⚡ Quick Start

### 1. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Stripe keys
nano .env  # or use your preferred editor
```

**Required variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 2. Start the Stack

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service health
docker compose ps
```

### 3. Verify Services

```bash
# Health checks
curl http://localhost:3000/health      # Webhook server
curl http://localhost:3099/health      # Billing webhook
curl http://localhost:4310/health      # Subscription UI
curl http://localhost:4320/health      # Web module API

# Database connection
docker compose exec db psql -U test_user -d chefiapp_core_test -c "SELECT COUNT(*) FROM event_store;"
```

### 4. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v
```

---

## ⚙️ Configuration

### Environment Variables

All configuration is managed through `.env` file. See `.env.example` for complete reference.

#### Core Settings

```bash
# Stripe API (REQUIRED)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_password
POSTGRES_DB=chefiapp_core_test
DB_PORT=5432

# Service Ports
WEBHOOK_PORT=3000
BILLING_WEBHOOK_PORT=3099
SUBSCRIPTION_UI_PORT=4310
WEB_MODULE_PORT=4320
```

### Port Conflicts

If default ports are already in use:

```bash
# Edit .env file
DB_PORT=5433
WEBHOOK_PORT=3001
BILLING_WEBHOOK_PORT=3100
# etc.
```

---

## 🏗️ Services

### Service Overview

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **db** | 5432 | PostgreSQL 15 with event store schema | `pg_isready` |
| **webhook-server** | 3000 | Stripe webhook handler | `/health` |
| **billing-webhook-server** | 3099 | Billing & subscription webhooks | `/health` |
| **subscription-ui** | 4310 | Subscription management interface | `/health` |
| **web-module-api** | 4320 | Web module API server | `/health` |
| **pgadmin** | 5050 | Database management (optional) | Profile: `tools` |

### Starting Individual Services

```bash
# Start only database
docker compose up -d db

# Start database + webhook server
docker compose up -d db webhook-server

# Start with database tools
docker compose --profile tools up -d
```

### Scaling Services

```bash
# Run multiple webhook server instances
docker compose up -d --scale webhook-server=3

# View scaled services
docker compose ps
```

---

## 🛠️ Development

### Local Development with Docker

```bash
# Start services in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Hot reload (requires docker-compose.dev.yml)
# Mount source code as volume for live updates
```

### Running Tests

```bash
# Start database for testing
docker compose up -d db

# Run tests on host machine (faster)
npm test

# Or run tests inside container
docker compose exec webhook-server npm test
```

### Debugging

```bash
# View logs
docker compose logs -f webhook-server
docker compose logs -f db

# Access container shell
docker compose exec webhook-server sh
docker compose exec db psql -U test_user -d chefiapp_core_test

# Inspect container
docker compose exec webhook-server env
docker compose exec webhook-server cat /etc/os-release
```

### Database Operations

```bash
# Access database CLI
docker compose exec db psql -U test_user -d chefiapp_core_test

# Dump database
docker compose exec db pg_dump -U test_user chefiapp_core_test > backup.sql

# Restore database
docker compose exec -T db psql -U test_user -d chefiapp_core_test < backup.sql

# Reset database
docker compose down -v db
docker compose up -d db
```

---

## 🚀 Production

### Building for Production

```bash
# Build with version tags
docker build \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  --build-arg VERSION=1.0.0 \
  -t chefiapp/pos-core:1.0.0 \
  -t chefiapp/pos-core:latest \
  .

# Test production image
docker run --rm \
  -e STRIPE_SECRET_KEY=sk_test_xxx \
  -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  -e DATABASE_URL=postgresql://... \
  -p 3000:3000 \
  chefiapp/pos-core:latest
```

### Production Checklist

- [ ] **Environment Variables**: Use secrets management (not .env files)
- [ ] **Database**: External managed PostgreSQL (not container)
- [ ] **Volumes**: Persistent storage for database data
- [ ] **Health Checks**: All services have working health endpoints
- [ ] **Resource Limits**: Set CPU/memory limits in compose
- [ ] **Logging**: Configure log aggregation (ELK, Datadog, etc.)
- [ ] **Monitoring**: Set up metrics and alerts
- [ ] **Backups**: Automated database backups
- [ ] **TLS**: Use reverse proxy (nginx, Traefik) for HTTPS
- [ ] **Security**: Run security scan on images

### Security Hardening

The Dockerfile already implements:

✅ **Multi-stage build** - Minimal attack surface  
✅ **Non-root user** - Runs as `nodejs:nodejs` (UID 1001)  
✅ **Read-only filesystem** - Container filesystem is immutable  
✅ **Dropped capabilities** - Only essential Linux capabilities  
✅ **No new privileges** - Prevents privilege escalation  
✅ **Alpine base** - Minimal image size (~50MB)  

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  webhook-server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: port is already allocated
# Solution: Change port in .env
DB_PORT=5433
```

#### Database Connection Failed

```bash
# Check database is running
docker compose ps db

# Check logs
docker compose logs db

# Test connection
docker compose exec db psql -U test_user -d chefiapp_core_test -c "SELECT 1;"
```

#### Health Check Failing

```bash
# Check service logs
docker compose logs webhook-server

# Manual health check
docker compose exec webhook-server wget --spider http://localhost:3000/health

# Check environment variables
docker compose exec webhook-server env | grep STRIPE
```

#### Out of Memory

```bash
# Check container resource usage
docker stats

# Increase Docker Desktop memory allocation
# Docker Desktop > Settings > Resources > Memory
```

### Logs & Debugging

```bash
# View all logs
docker compose logs

# Follow specific service
docker compose logs -f webhook-server --tail=100

# Export logs
docker compose logs > logs.txt

# Check container details
docker compose exec webhook-server ps aux
docker compose exec webhook-server df -h
```

---

## 📚 Best Practices

### Security

1. **Never commit `.env`** - Use secrets management in production
2. **Use image scanning** - `docker scan chefiapp/pos-core:latest`
3. **Keep images updated** - Rebuild regularly for security patches
4. **Minimal privileges** - Don't run as root, drop capabilities
5. **Network isolation** - Use Docker networks, not host networking

### Performance

1. **Layer caching** - Order Dockerfile commands by change frequency
2. **Multi-stage builds** - Separate build and runtime dependencies
3. **Alpine images** - Smaller size = faster pulls
4. **Health checks** - Implement for all services
5. **Resource limits** - Prevent resource exhaustion

### Maintenance

1. **Regular updates** - Keep base images current
2. **Prune regularly** - Remove unused images/volumes
3. **Monitor logs** - Set up log aggregation early
4. **Backup database** - Automated daily backups
5. **Version tags** - Never use `latest` in production

### Cleanup Commands

```bash
# Remove stopped containers
docker compose down

# Remove all project containers and volumes
docker compose down -v

# Clean up Docker system
docker system prune -a --volumes

# Remove dangling images
docker image prune
```

---

## 📖 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Verify environment: `docker compose config`
3. Review documentation: [DOCKER.md](./DOCKER.md)
4. Check health: `docker compose ps`

---

**Built with ❤️ by Goldmonkey Empire**
