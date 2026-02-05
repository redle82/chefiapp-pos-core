# ChefIApp OS — Simulador de pedidos (orders)
# Executa script que injeta pedidos no Core via PostgREST.
# Node 20 para fetch nativo.

FROM node:20-alpine

WORKDIR /app

# Build context is repo root (docker compose -f docker-core/docker-compose.core.yml)
COPY simulators/orders/run.js .

# Execução única por default (COUNT pedidos). Para loop: LOOP=true
ENV POSTGREST_URL=http://nginx:3001
ENV RESTAURANT_ID=00000000-0000-0000-0000-000000000100
ENV COUNT=5
ENV SOURCE=tpv
ENV DELAY_MS=500

CMD ["node", "run.js"]
