import prisma from "../prisma";
import { generateJsonFromPrompt } from "../gemini/gemini.client";

export async function createPrompt(userId: string, inputText: string) {
  const outputJson = await generateJsonFromPrompt(inputText);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error(`User not found for Clerk ID: ${userId}`);
  }
  const prompt = await prisma.$transaction(async (tx) => {
    // deduct token
    await tx.user.update({
      where: { id: user.id },
      data: { tokens: { decrement: 1 } },
    });

    // create prompt
    return await tx.prompt.create({
      data: {
        userId: user.id,
        inputText,
        outputJson,
      },
    });
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
