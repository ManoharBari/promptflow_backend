import prisma from "../prisma";
import { generateJsonFromPrompt } from "../gemini/gemini.client";

export async function createPrompt(userId: string, inputText: string) {
  const outputJson = await generateJsonFromPrompt(inputText);

  const prompt = await prisma.prompt.create({
    data: {
      userId,
      inputText,
      outputJson,
    },
  });

  return prompt;
}

export async function listPrompts(userId: string, limit = 50, skip = 0) {
  return prisma.prompt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });
}

export async function getPrompt(userId: string, id: string) {
  return prisma.prompt.findFirst({ where: { id, userId } });
}
