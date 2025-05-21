declare module 'openai' {
    interface OpenAIOptions {
        apiKey?: string;
    }
    class OpenAI {
        constructor(options?: OpenAIOptions);
    }
    export default OpenAI;
}
