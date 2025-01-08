import OpenAI from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

/**
 * Classifies a query as either a question or a search
 */
export async function classifyQuery(query) {
    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a query classifier. Determine if the input is a question or a file search. Respond with exactly 'question' or 'search'."
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0,
            max_tokens: 10
        });

        const classification = response.choices[0].message.content.trim().toLowerCase();
        return classification;
    } catch (error) {
        console.error('[AI Classify] Error during classification:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        // Default to search if classification fails
        return 'search';
    }
}

/**
 * Generates an answer to a question using relevant blocks as context
 */
export async function generateAnswer(question, relevantBlocks) {
    //Flatten the array of arrays and filter out empty arrays
    const blocks = relevantBlocks.flat().filter(block => block && block.title);

    try {
        // Format the context from relevant blocks
        const context = blocks
            .map(block => `Title: ${block.title}\nContent: ${block.plainText}`)
            .join('\n\n');

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_ANSWER_MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are a knowledgeable assistant providing accurate information from your notes.
                    For each fact you mention, cite the source using [Title] at the end of the sentence.
                    Write in a natural, engaging style without mentioning "the context" or "the provided information" or "the notes" or anything similar.
                    If you can't find relevant information to answer the question, simply say "I don't have enough information to answer that question."
                    Keep responses concise and informative.`
                },
                {
                    role: "user",
                    content: `Context:\n${context}\n\nQuestion: ${question}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const answer = response.choices[0].message.content;

        const result = {
            answer,
            sources: blocks.map(block => ({
                id: block.id,
                title: block.title
            }))
        };

        return result;
    } catch (error) {
        console.error('[AI Answer] Error generating answer:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        throw new Error('Failed to generate answer from context');
    }
}