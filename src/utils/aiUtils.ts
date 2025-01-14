import OpenAI from 'openai';
import { QueryType, AnswerResult } from '@/types/ai';
import { Block } from '@/types/block';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Classifies a query as either a question or a search
 */
export async function classifyQuery(query: string): Promise<QueryType> {
    const trimmedQuery = query.trim();
    return trimmedQuery.endsWith('?') ? 'question' : 'search';
}

/**
 * Generates an answer to a question using relevant blocks as context
 */
export async function generateAnswer(
    question: string,
    relevantBlocks: Block[]
): Promise<AnswerResult> {
    // Flatten the array of arrays and filter out empty arrays
    const blocks = relevantBlocks.flat().filter((block) => block && block.title);

    try {
        // Format the context from relevant blocks
        const context = blocks
            .map((block) => `Title: ${block.title}\nContent: ${block.plainText}`)
            .join('\n\n');

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_ANSWER_MODEL || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a knowledgeable assistant providing accurate information from your notes.
                    You may also provide advice or recommendations based on the notes.
                    For each fact you mention, YOU MUST cite the source using [Title] at the end of the sentence.
                    You are populating as a plain text paragraph, so do not use markdown or html or any other distracting formatting.
                    Write in a natural, engaging style without mentioning "the context" or "the provided information" or "the notes" or anything similar.
                    If you can't find any relevant information to answer the question, simply say "I don't have enough information to answer that question."
                    Keep responses concise and informative.`,
                },
                {
                    role: 'user',
                    content: `Context:\n${context}\n\nQuestion: ${question}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const answer = response.choices[0].message.content;

        if (!answer) {
            throw new Error('No answer generated');
        }

        const result: AnswerResult = {
            answer,
            sources: blocks.map((block) => ({
                id: block.id,
                title: block.title,
            })),
        };

        return result;
    } catch (error) {
        console.error('[AI Answer] Error generating answer:', {
            name: error instanceof Error ? error.name : 'Unknown Error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: error instanceof Error ? (error as any).code : undefined,
        });
        throw new Error('Failed to generate answer from context');
    }
}
