import OpenAI from "openai";

const client = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Sos un asistente técnico. Respondés en español, de forma concisa." },
      { role: "user", content: "¿Qué es un token en el contexto de LLMs?" }
    ],
    temperature: 0,
    max_tokens: 300,
  });

  const choice = response.choices[0];

  console.log("=== RESPUESTA ===");
  console.log(choice.message.content);

  console.log("\n=== METADATA ===");
  console.log(`Tokens input:  ${response.usage?.prompt_tokens}`);
  console.log(`Tokens output: ${response.usage?.completion_tokens}`);
  console.log(`Tokens total:  ${response.usage?.total_tokens}`);
  console.log(`Stop reason:   ${choice.finish_reason}`);

  // Costo con precios de gpt-4o-mini
  const inputCost  = (response.usage?.prompt_tokens ?? 0) * 0.15 / 1_000_000;
  const outputCost = (response.usage?.completion_tokens ?? 0) * 0.60 / 1_000_000;
  console.log(`\nCosto: $${(inputCost + outputCost).toFixed(6)}`);
}

main().catch(console.error);