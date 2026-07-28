import OpenAI from "openai";

const client = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });

async function main() {
  console.log("=== RESPUESTA (streaming) ===\n");

  const start = Date.now();
  let outputTokens = 0;

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Sos un asistente técnico. Respondés en español, de forma concisa." },
      { role: "user", content: "Explicá qué es el machine learning en 4 oraciones." }
    ],
    temperature: 0.7,
    max_tokens: 300,
    stream: true,
    stream_options: { include_usage: true },
  });

  let firstTokenLogged = false;

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;

  if (delta) {
    if (!firstTokenLogged) {
      console.error(`[primer token: ${Date.now() - start}ms]`);
      firstTokenLogged = true;
    }
    process.stdout.write(delta);
  }

  if (chunk.usage) {
    outputTokens = chunk.usage.completion_tokens;
  }
}

  const latency = Date.now() - start;

  console.log("\n\n=== METADATA ===");
  console.log(`Tokens output: ${outputTokens}`);
  console.log(`Latencia total: ${latency}ms`);
  console.log(`Tiempo al primer token: observalo visualmente`);
}

main().catch(console.error);