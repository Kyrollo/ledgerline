# API Reference

The Ledgerline API adheres to OpenAPI 3.1 specifications.

- Interactive OpenAPI Swagger UI: `http://localhost:8009/docs`
- Redoc Reference: `http://localhost:8009/redoc`

## Standard Endpoints
- `GET /healthz`: Kubernetes liveness probe
- `GET /readyz`: Upstream dependency readiness probe
- `GET /metrics`: Prometheus metrics exporter
- `POST /api/v1/auth/token`: OAuth2 password login
