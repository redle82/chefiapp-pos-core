/**
 * Local Boss - Generate Insights
 * 
 * Analyzes reviews and generates insights/recommendations (v1 - heuristics).
 */

import { Pool } from 'pg';

export interface InsightTheme {
    theme: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    examples: string[];
}

export interface InsightRecommendation {
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
}

export interface InsightResult {
    score: number;
    themes: InsightTheme[];
    recommendations: InsightRecommendation[];
}

/**
 * Generate insights from reviews
 */
export async function generateInsights(
    pool: Pool,
    restaurantId: string,
    periodDays: number = 30
): Promise<InsightResult> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date();

    // Get reviews from period
    const reviewsResult = await pool.query(
        `SELECT rating, text_safe, language
         FROM local_boss_reviews
         WHERE restaurant_id = $1
         AND published_at >= $2
         AND published_at <= $3
         ORDER BY published_at DESC`,
        [restaurantId, periodStart.toISOString(), periodEnd.toISOString()]
    );

    const reviews = reviewsResult.rows;
    if (reviews.length === 0) {
        return {
            score: 0,
            themes: [],
            recommendations: []
        };
    }

    // Calculate base score (weighted average rating)
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;
    let score = (avgRating / 5) * 100; // Convert to 0-100 scale

    // Theme detection (simple keyword matching)
    const themeKeywords = {
        tempo: ['demora', 'espera', 'lento', 'rápido', 'rápida', 'wait', 'slow', 'fast', 'tiempo', 'esperar'],
        atendimento: ['atendimento', 'serviço', 'garçom', 'waiter', 'service', 'atendió', 'servicio'],
        comida: ['comida', 'sabor', 'gosto', 'food', 'taste', 'sabor', 'comida'],
        preço: ['preço', 'caro', 'barato', 'price', 'expensive', 'cheap', 'precio', 'caro'],
        limpeza: ['limpo', 'sujo', 'limpeza', 'clean', 'dirty', 'limpieza', 'limpo']
    };

    const themes: InsightTheme[] = [];
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
        let count = 0;
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        const examples: string[] = [];

        for (const review of reviews) {
            const text = (review.text_safe || '').toLowerCase();
            const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));
            
            if (hasKeyword) {
                count++;
                // Simple sentiment: negative keywords reduce sentiment
                const negativeWords = ['demora', 'lento', 'caro', 'sujo', 'ruim', 'bad', 'slow', 'expensive', 'dirty'];
                if (negativeWords.some(nw => text.includes(nw))) {
                    sentiment = 'negative';
                } else if (sentiment === 'neutral') {
                    sentiment = 'positive';
                }
                
                // Collect example (first 100 chars)
                if (examples.length < 3) {
                    examples.push(review.text_safe.substring(0, 100) + '...');
                }
            }
        }

        if (count > 0) {
            themes.push({ theme, count, sentiment, examples });
        }
    }

    // Sort themes by count
    themes.sort((a, b) => b.count - a.count);

    // Generate recommendations
    const recommendations: InsightRecommendation[] = [];

    // High priority: negative themes with high count
    const negativeThemes = themes.filter(t => t.sentiment === 'negative' && t.count >= 3);
    for (const theme of negativeThemes) {
        const actionMap: Record<string, string> = {
            tempo: 'Reduzir tempo de entrega / Revisar fluxo da cozinha',
            atendimento: 'Treinar equipe de atendimento / Revisar processos',
            comida: 'Revisar qualidade dos pratos / Padronizar receitas',
            preço: 'Revisar precificação / Comunicar valor melhor',
            limpeza: 'Reforçar protocolos de limpeza / Inspeções regulares'
        };
        
        recommendations.push({
            priority: 'high',
            action: actionMap[theme.theme] || `Melhorar ${theme.theme}`,
            reason: `${theme.count} comentários mencionam ${theme.theme} negativamente`
        });
    }

    // Medium priority: low average rating
    if (avgRating < 3.5) {
        recommendations.push({
            priority: 'medium',
            action: 'Revisar experiência geral do cliente',
            reason: `Avaliação média está abaixo de 3.5 (${avgRating.toFixed(1)})`
        });
    }

    // Low priority: positive themes to reinforce
    const positiveThemes = themes.filter(t => t.sentiment === 'positive' && t.count >= 5);
    for (const theme of positiveThemes.slice(0, 2)) {
        recommendations.push({
            priority: 'low',
            action: `Manter excelência em ${theme.theme}`,
            reason: `${theme.count} comentários elogiam ${theme.theme}`
        });
    }

    // Penalize score for negative themes
    const negativeCount = negativeThemes.reduce((sum, t) => sum + t.count, 0);
    if (negativeCount > 0) {
        score = Math.max(0, score - (negativeCount * 2)); // -2 points per negative mention
    }

    // Store insight
    await pool.query(
        `INSERT INTO local_boss_insights 
         (restaurant_id, period_start, period_end, score, themes, recommendations)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         ON CONFLICT (restaurant_id, period_start, period_end)
         DO UPDATE SET
             score = EXCLUDED.score,
             themes = EXCLUDED.themes,
             recommendations = EXCLUDED.recommendations`,
        [
            restaurantId,
            periodStart.toISOString(),
            periodEnd.toISOString(),
            score,
            JSON.stringify(themes),
            JSON.stringify(recommendations)
        ]
    );

    return { score, themes: themes.slice(0, 5), recommendations };
}

