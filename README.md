# LLM Week 1 — APIs crudas con OpenAI

Semana 1 del roadmap de AI Integration. Exploración de los fundamentos
de la API de OpenAI sin frameworks ni abstracciones.

## Qué cubre

- `01-first-call.ts` — tokens, costos, max_tokens y temperature en acción
- `02-streaming.ts` — streaming con SSE, medición de tiempo al primer token
- `03-retry.ts` — backoff exponencial, jitter y fail fast por tipo de error

## Stack

- Bun + TypeScript
- openai SDK

## Setup

```bash
bun install
cp .env.example .env  # agregá tu OPENAI_API_KEY
bun run src/01-first-call.ts
```

## Aprendizajes clave

- temperature: 0 no es determinista — confirmado empíricamente
- max_tokens es un techo, no un objetivo
- Los errores 400/401 no se reintentan — fail fast
- El jitter desincroniza múltiples instancias ante un 429
