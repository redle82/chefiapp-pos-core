export const analyzeSentiment = async (text: string) => { return { score: 0 }; };

export const analyzeSentimentByTopic = (text: string) => {
    return new Map<string, { score: number, mentions: number }>();
};

export const analyzePriceSentiment = (text: string) => {
    return { explicit: 'not_mentioned', implicit: false };
};

export const extractTopPhrases = (text: string) => {
    return [];
};

export const anonymizeText = (text: string) => {
    return text;
};

export type Topic = string;
