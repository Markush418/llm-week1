import OpenAI from "openai";

const client = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });

// --- Configuración del retry ---
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 4,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
};

// --- Helpers ---
function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || error.status >= 500;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

// --- Función principal con retry ---
async function callWithRetry(
  userMessage: string,
  config: RetryConfig = DEFAULT_RETRY
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const wait = backoffMs(attempt - 1, config);
        console.log(`[retry] intento ${attempt + 1}/${config.maxAttempts} — esperando ${Math.round(wait)}ms`);
        await delay(wait);
      }

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sos un asistente técnico. Respondés en español, de forma concisa." },
          { role: "user", content: userMessage },
        ],
        temperature: 0,
        max_tokens: 200,
      });

      const text = response.choices[0].message.content ?? "";
      console.log(`[ok] respondió en el intento ${attempt + 1}`);
      return text;

    } catch (error) {
      lastError = error;

      if (error instanceof OpenAI.APIError) {
        console.warn(`[warn] error ${error.status}: ${error.message}`);

        // Fail fast — no reintentes errores no recuperables
        if (!isRetryable(error)) {
          console.error(`[fail fast] error ${error.status} no es reintentable`);
          throw error;
        }
      }

      if (attempt === config.maxAttempts - 1) {
        console.error(`[error] máximo de intentos alcanzado`);
      }
    }
  }

  throw lastError;
}

// --- Demo ---
async function main() {
  console.log("=== TEST 1: llamada normal ===\n");
  try {
    const result = await callWithRetry("¿Qué es el backoff exponencial?");
    console.log("\nRespuesta:", result);
  } catch (err) {
    console.error("Falló:", err);
  }

  console.log("\n=== TEST 2: API key inválida (fail fast) ===\n");
  const badClient = new OpenAI({ apiKey: "sk-invalida-123" });
  try {
    await badClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "hola" }],
      max_tokens: 10,
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.log(`Error ${err.status} — reintentable: ${isRetryable(err)}`);
      console.log("Comportamiento correcto: fail fast, no retry");
    }
  }
}

main().catch(console.error);