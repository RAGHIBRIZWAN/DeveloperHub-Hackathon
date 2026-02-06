# Judge0 Self-Hosted Setup Guide
# ================================

## Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Port 2358 available

## Quick Start

### 1. Start Judge0
```bash
cd judge0
docker-compose up -d
```

### 2. Check Status
```bash
docker-compose ps
```
Wait for all services to be healthy (about 30-60 seconds).

### 3. Verify Judge0 is Running
```bash
curl http://localhost:2358/system_info
```

### 4. Get Available Languages
```bash
curl http://localhost:2358/languages
```

## Configuration

### Environment Variables (in .env)
```
JUDGE0_URL=http://localhost:2358
```

### Update Backend
The backend will automatically use the self-hosted Judge0 instance if configured.

## Language IDs (Common)
- Python (3.8.1): 71
- C++ (GCC 9.2.0): 54  
- JavaScript (Node.js 12.14.0): 63
- Java (OpenJDK 13.0.1): 62
- C (GCC 9.2.0): 50

## Stopping Judge0
```bash
cd judge0
docker-compose down
```

## Stopping & Removing Data
```bash
cd judge0
docker-compose down -v
```

## Troubleshooting

### Check Logs
```bash
docker-compose logs judge0-server
docker-compose logs judge0-workers
```

### Memory Issues
If experiencing memory issues, reduce the number of workers or memory limits in the compose file.

### Permission Issues
Judge0 workers need privileged mode for isolation. Ensure Docker has the required permissions.
