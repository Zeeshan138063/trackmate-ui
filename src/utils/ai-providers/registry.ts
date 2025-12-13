import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createHuggingFace } from '@ai-sdk/huggingface';
import { LanguageModel } from 'ai';

export type AIProviderId = 'gemini' | 'openai' | 'deepseek' | 'huggingface';

export const PROVIDERS: { id: AIProviderId; name: string }[] = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'huggingface', name: 'Hugging Face' },
];

export const getProvider = (providerId: AIProviderId): LanguageModel | null => {
    switch (providerId) {
        case 'gemini': {
            const apiKey = localStorage.getItem('GEMINI_API_KEY');
            const modelName = localStorage.getItem('GEMINI_MODEL_NAME') || 'gemini-1.5-flash';
            if (!apiKey) return null;

            const google = createGoogleGenerativeAI({
                apiKey: apiKey,
            });
            return google(modelName);
        }
        case 'openai': {
            const apiKey = localStorage.getItem('OPENAI_API_KEY');
            const modelName = localStorage.getItem('OPENAI_MODEL_NAME') || 'gpt-4o';
            if (!apiKey) return null;

            const openai = createOpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });
            return openai(modelName);
        }
        case 'deepseek': {
            const apiKey = localStorage.getItem('DEEPSEEK_API_KEY');
            const modelName = localStorage.getItem('DEEPSEEK_MODEL_NAME') || 'deepseek-chat';
            if (!apiKey) return null;

            // DeepSeek is compatible with OpenAI SDK
            const deepseek = createOpenAI({
                baseURL: 'https://api.deepseek.com',
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });
            return deepseek(modelName);
        }
        case 'huggingface': {
            const apiKey = localStorage.getItem('HUGGINGFACE_API_KEY');
            const modelName = localStorage.getItem('HUGGINGFACE_MODEL_NAME') || 'meta-llama/Meta-Llama-3-8B-Instruct';
            if (!apiKey) return null;

            const huggingface = createHuggingFace({
                apiKey: apiKey,
            });
            return huggingface(modelName);
        }
        default:
            return null;
    }
};
