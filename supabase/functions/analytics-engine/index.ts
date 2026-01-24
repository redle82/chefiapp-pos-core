import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Analytics Engine Initialized");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { action, restaurantId, daysToForecast = 7 } = await req.json();

        if (!restaurantId) throw new Error("Missing restaurantId");

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (action === 'forecast-sales') {
            // 1. Fetch historical Daily Sales (last 30 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);

            const { data: payments, error } = await supabase
                .from('gm_payments')
                .select('amount_cents, created_at')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (error) throw error;

            // 2. Aggregate by Day
            const dailySales: Record<string, number> = {};
            payments?.forEach(p => {
                const date = new Date(p.created_at).toISOString().split('T')[0];
                dailySales[date] = (dailySales[date] || 0) + p.amount_cents;
            });

            // 3. Prepare Data for Regression (X = Day Index, Y = Sales)
            const sortedDates = Object.keys(dailySales).sort();
            const x = sortedDates.map((_, i) => i);
            const y = sortedDates.map(date => dailySales[date]);

            // 4. Simple Linear Regression (Least Squares)
            const n = x.length;
            if (n < 2) {
                return new Response(JSON.stringify({
                    forecast: [],
                    message: "Not enough data for prediction"
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
            const sumXX = x.reduce((a, b) => a + b * b, 0);

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            // 5. Generate Forecast
            const forecast = [];
            const lastDate = new Date(sortedDates[sortedDates.length - 1]);

            for (let i = 1; i <= daysToForecast; i++) {
                const nextDate = new Date(lastDate);
                nextDate.setDate(lastDate.getDate() + i);
                const nextX = n - 1 + i; // Continue the X sequence
                const predictedSales = Math.max(0, slope * nextX + intercept); // No negative sales

                forecast.push({
                    date: nextDate.toISOString().split('T')[0],
                    predicted_cents: Math.round(predictedSales)
                });
            }

            return new Response(JSON.stringify({
                historical: sortedDates.map((d, i) => ({ date: d, amount_cents: y[i] })),
                forecast,
                model: { slope, intercept }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        throw new Error("Invalid action");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
