// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "gpt-4o-mini",
    label: "GPT 4o mini",
    apiIdentifier: "gpt-4o-mini",
    description: "Small model for fast, lightweight tasks",
  },
  {
    id: "gpt-4o",
    label: "GPT 4o",
    apiIdentifier: "gpt-4o",
    description: "For complex, multi-step tasks",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    apiIdentifier: "deepseek",
    description: "Local DeepSeek model via LM Studio",
  },
  {
    id: "groq-deepseek",
    label: "Groq DeepSeek-70B",
    apiIdentifier: "groq-deepseek",
    description: "DeepSeek LLaMA 70B model via Groq Cloud",
  },
] as const;

export const DEFAULT_MODEL_NAME: string = "groq-deepseek";
