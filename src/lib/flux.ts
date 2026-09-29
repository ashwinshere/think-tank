import { InferenceClient } from "@huggingface/inference";

const token = process.env.HF_TOKEN;

if (!token) {
  throw new Error("HF_TOKEN is missing from .env.local");
}

const hf = new InferenceClient(token);

export async function generateMemeImage(prompt: string) {
  const image = await hf.textToImage({
    provider: "auto",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: {
      num_inference_steps: 4,
    },
    output_type: "blob",
  });

  return image;
}