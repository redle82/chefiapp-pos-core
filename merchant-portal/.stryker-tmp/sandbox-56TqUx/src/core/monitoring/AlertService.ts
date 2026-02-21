
/**
 * ALERT SERVICE (Discord Integration)
 * Sends critical alerts to an external channel.
 */
// @ts-nocheck

class AlertService {
    private static instance: AlertService;
    private webhookUrl: string | undefined;
    private isDev: boolean;
    private lastAlertTime: number = 0;

    private constructor() {
        this.webhookUrl = typeof process !== 'undefined' ? process.env.VITE_DISCORD_WEBHOOK_URL : undefined;
        this.isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    }

    public static getInstance(): AlertService {
        if (!AlertService.instance) {
            AlertService.instance = new AlertService();
        }
        return AlertService.instance;
    }

    public async sendCritical(message: string, context: any) {
        if (!this.webhookUrl) {
            if (this.isDev) console.log('[AlertService] Mock Alert (No Webhook):', message);
            return;
        }

        // Rate Limit Prevention (1 alert per 5 seconds)
        const now = Date.now();
        if (now - this.lastAlertTime < 5000) {
            console.warn('[AlertService] Throttled alert:', message);
            return;
        }

        try {
            const body = {
                username: "ChefIApp Watchdog",
                avatar_url: "https://i.imgur.com/4M34hi2.png",
                embeds: [
                    {
                        title: "🔴 CRITICAL SYSTEM ALERT",
                        description: message,
                        color: 15158332, // Red
                        fields: [
                            {
                                name: "Context",
                                value: this.formatContext(context),
                                inline: false
                            },
                            {
                                name: "Environment",
                                value: this.isDev ? "Development" : "Production",
                                inline: true
                            },
                            {
                                name: "Timestamp",
                                value: new Date().toISOString(),
                                inline: true
                            }
                        ]
                    }
                ]
            };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            this.lastAlertTime = now;

        } catch (error) {
            // Failsafe: Don't crash if alerting fails
            console.error('[AlertService] Failed to send alert:', error);
        }
    }

    private formatContext(context: any): string {
        try {
            const str = JSON.stringify(context, null, 2);
            return str.length > 1000 ? str.substring(0, 1000) + '...' : str;
        } catch {
            return "Unparseable Context";
        }
    }
}

export const Alerts = AlertService.getInstance();
