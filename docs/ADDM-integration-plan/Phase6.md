# Phase 6: Deployment & Documentation

## Phase Overview

**Goal:** Deploy ADDM integration to production and create comprehensive documentation

**Prerequisites:**
- Phases 1-5 complete
- All tests passing
- Production environment ready
- Domain/hosting configured

**Estimated Duration:** 5-7 days

**Key Deliverables:**
- Production Docker configuration
- Deployment runbook
- User documentation
- Developer API reference
- Monitoring and alerting setup
- Rollback procedures

## Step-by-Step Implementation

### Step 1: Production Docker Configuration

**Duration:** 1 day

#### File: `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  addm-service:
    build:
      context: ./addm-service
      dockerfile: Dockerfile
    
    ports:
      - "8000:8000"
    
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=warning
      - MAX_ITERATIONS=20
      - DEFAULT_CONFIDENCE_THRESHOLD=0.85
    
    env_file:
      - .env.production
    
    restart: always
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  frontend:
    build:
      context: ./swarm-forge
      dockerfile: Dockerfile
    
    ports:
      - "80:80"
      - "443:443"
    
    environment:
      - VITE_ADDM_SERVICE_URL=http://addm-service:8000
      - NODE_ENV=production
    
    depends_on:
      addm-service:
        condition: service_healthy
    
    restart: always
    
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  default:
    name: addm-swarm-network
```

#### File: `.env.production.example`

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# ADDM Service
ENVIRONMENT=production
LOG_LEVEL=warning

# Frontend
VITE_ADDM_SERVICE_URL=https://addm-api.yourdomain.com
```

### Step 2: Deployment Runbook

**Duration:** 1 day

#### Document: `DEPLOYMENT.md`

```markdown
# ADDM-Swarm Deployment Runbook

## Prerequisites

- Docker and docker-compose installed
- OpenRouter API key obtained
- Domain configured (optional)
- SSL certificates (for HTTPS)

## Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-org/addm-swarm.git
cd addm-swarm
```

### 2. Configure Environment

```bash
cp .env.production.example .env.production
nano .env.production  # Add your API keys
```

### 3. Build Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 4. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Verify Health

```bash
# Check ADDM service
curl https://your-domain.com/addm/health

# Check frontend
curl https://your-domain.com
```

### 6. Monitor Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f addm-service
```

## Rollback Procedure

### Quick Rollback

```bash
# Stop ADDM service
docker-compose -f docker-compose.prod.yml stop addm-service

# Disable ADDM in UI
# Users can still use standard/parallel modes
```

### Full Rollback

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Revert to previous version
git checkout previous-version-tag
docker-compose -f docker-compose.prod.yml up -d
```

## Health Checks

### ADDM Service Health

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "addm-regulator"}
```

### Database Connectivity (if applicable)

```bash
docker-compose exec addm-service python -c "from src.core.config import settings; print('OK')"
```

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose logs addm-service`
2. Verify environment variables
3. Check OpenRouter API key validity

### High Response Times

1. Check OpenRouter API status
2. Review `maxIterations` setting
3. Monitor system resources

### Service Crashes

1. Check available memory
2. Review error logs
3. Restart service: `docker-compose restart addm-service`
```

### Step 3: User Documentation

**Duration:** 1-2 days

#### Document: `USER_GUIDE.md`

```markdown
# ADDM Loop Regulator - User Guide

## What is ADDM Mode?

ADDM (Agentic Drift-Diffusion Model) Mode is an advanced execution mode that intelligently decides when to:
- **Enhance**: Refine and improve the current response
- **Research**: Gather additional information
- **Complete**: Deliver the response to you

Unlike standard mode (single response) or parallel mode (multiple specialists), ADDM mode iteratively improves responses until quality thresholds are met.

## When to Use ADDM Mode

**Best for:**
- Research-heavy queries requiring thorough investigation
- Complex topics needing multi-perspective analysis
- Tasks where quality is more important than speed

**Not recommended for:**
- Simple questions with quick answers
- Time-sensitive queries
- High-volume usage (due to token costs)

## Enabling ADDM Mode

1. Click **Settings** icon
2. Navigate to **ADDM Loop Regulator** section
3. Toggle **Enable ADDM Mode**
4. Configure options:
   - **Workflow Mode**: Research Assembly or News Analysis
   - **Max Iterations**: 1-20 (recommend 5-10)
   - **Confidence Threshold**: 50-95% (recommend 85%)

⚠️ **Important**: ADDM mode uses 5-20x more tokens than standard mode. Monitor your usage.

## Understanding the Progress Indicator

When ADDM is running, you'll see:
- Current iteration number
- Decision type (enhance/research/complete)
- Confidence score
- Progress bar

## Reading the SwarmTrace

After completion, the SwarmTrace shows:
- **Decision Timeline**: All ADDM decisions made
- **Quality Metrics**: Scores for each iteration
- **Total Time**: Execution duration

## Tips for Best Results

1. **Start Conservative**: Use 5 max iterations initially
2. **Monitor Token Usage**: Check your bill after first few uses
3. **Adjust Confidence**: Higher threshold = more iterations
4. **Choose Right Mode**: Research Assembly for factual, News Analysis for balanced perspectives

## Troubleshooting

**"ADDM service not available"**
- Contact your administrator
- Fallback to standard mode

**"Loop taking too long"**
- Consider canceling (future feature)
- Reduce max iterations

**"High token usage"**
- Decrease max iterations
- Increase confidence threshold
- Use only for complex queries
```

### Step 4: Developer Documentation

**Duration:** 1-2 days

#### Document: `API_REFERENCE.md`

```markdown
# ADDM API Reference

## REST Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "addm-regulator",
  "version": "1.0.0"
}
```

### Make Decision

```http
POST /api/v1/decide
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Current response content to evaluate",
  "context": "Previous iteration context",
  "workflow_mode": "research_assembly",
  "iteration": 0,
  "confidence_threshold": 0.85,
  "max_iterations": 10
}
```

**Response:**
```json
{
  "decision": "enhance",
  "confidence": 0.75,
  "reaction_time": 145.3,
  "reasoning": "Response needs more detail...",
  "metrics": {
    "quality_score": 0.7,
    "completeness_score": 0.65,
    "improvement_potential": 0.8
  },
  "next_prompt": "Enhance previous response...",
  "should_summarize": false,
  "timestamp": "2025-01-24T10:30:00Z"
}
```

## TypeScript SDK

### ADDMClient

```typescript
import { ADDMClient } from './services/ADDMClient';

const client = new ADDMClient(config);

// Health check
const healthy = await client.healthCheck();

// Make decision
const decision = await client.makeDecision(request);
```

### useADDMLoop Hook

```typescript
import { useADDMLoop } from './hooks/useADDMLoop';

const {
  isLoading,
  currentIteration,
  executeADDMLoop,
  cancelLoop
} = useADDMLoop({
  onIterationComplete: (iteration, decision) => {
    console.log(`Iteration ${iteration}: ${decision.decision}`);
  }
});

// Execute loop
const result = await executeADDMLoop(prompt, sessionId, userId);
```

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Validation error | Check request format |
| 404 | Endpoint not found | Verify URL |
| 500 | Internal error | Check logs, retry |
| 503 | Service unavailable | Wait and retry |
```

### Step 5: Monitoring Setup

**Duration:** 1 day

#### Grafana Dashboard Configuration

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana:/var/lib/grafana
```

#### Metrics to Monitor

```markdown
## Key Metrics

### Service Health
- Uptime percentage
- Health check success rate
- Response time (p50, p95, p99)

### ADDM Performance
- Total loops executed
- Average iterations per loop
- Average confidence at completion
- Decision distribution (enhance/research/complete)

### Resource Usage
- CPU usage
- Memory usage
- API request rate to OpenRouter
- Token consumption rate

### Error Rates
- 4xx errors (client errors)
- 5xx errors (server errors)
- Timeout rate
- Retry rate
```

### Step 6: Alerting Configuration

**Duration:** 1 day

#### Alert Rules

```yaml
# monitoring/alerts.yml
groups:
  - name: addm_alerts
    interval: 30s
    rules:
      - alert: ADDMServiceDown
        expr: up{job="addm-service"} == 0
        for: 2m
        annotations:
          summary: "ADDM service is down"
          description: "Service has been down for >2 minutes"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate >5% for 5 minutes"
      
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 10m
        annotations:
          summary: "Slow response times"
          description: "P95 latency >5s for 10 minutes"
```

## Post-Deployment Checklist

- [ ] Services running and healthy
- [ ] Health checks passing
- [ ] SSL certificates configured (if HTTPS)
- [ ] Monitoring dashboards accessible
- [ ] Alerts configured and tested
- [ ] Logs being collected
- [ ] Backup strategy in place
- [ ] Documentation published
- [ ] Team trained on operations
- [ ] Rollback procedure tested

## Maintenance

### Regular Tasks

**Daily:**
- Check service health
- Review error logs
- Monitor token usage

**Weekly:**
- Review performance metrics
- Check for service updates
- Analyze user feedback

**Monthly:**
- Review and optimize configurations
- Update dependencies
- Conduct disaster recovery drill

## Support

For issues or questions:
- Check troubleshooting guides
- Review logs
- Contact DevOps team
- Submit GitHub issue

---

**Phase 6 Character Count:** ~13,000
