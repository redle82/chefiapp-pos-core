export const sanitizeReview = (text: string) => { return text; };

export const sanitizeReviewText = (text: string, options: any) => {
    return { textSafe: text, detectedNames: [] as string[] };
};
