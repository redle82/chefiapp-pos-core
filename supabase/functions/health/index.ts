import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    // CORS Headers for browser access
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Simple OK response
    const data = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'supabase-edge-health'
    }

    return new Response(
        JSON.stringify(data),
        {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        }
    )
})
