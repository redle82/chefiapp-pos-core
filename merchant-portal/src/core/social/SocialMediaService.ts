/**
 * P6-7: Social Media Integration Service
 * 
 * Serviço para integração com redes sociais
 */

import { Logger } from '../logger';
import { supabase } from '../supabase';

export interface SocialMediaPost {
    id: string;
    platform: 'instagram' | 'facebook' | 'twitter';
    content: string;
    imageUrl?: string;
    scheduledAt?: Date;
    published: boolean;
}

export interface SocialMediaCampaign {
    id: string;
    name: string;
    platforms: ('instagram' | 'facebook' | 'twitter')[];
    trigger: 'popular_item' | 'daily_special' | 'new_item' | 'milestone';
    template: string;
    enabled: boolean;
}

class SocialMediaService {
    /**
     * Post to social media
     */
    async postToSocialMedia(
        platform: 'instagram' | 'facebook' | 'twitter',
        content: string,
        imageUrl?: string
    ): Promise<{ success: boolean; postId?: string; error?: string }> {
        try {
            // TODO: Integrate with real social media APIs
            // For now, log the post
            Logger.info('Social media post created (placeholder)', {
                platform,
                content,
                imageUrl,
            });

            // Store in database
            const { data, error } = await supabase
                .from('social_media_posts')
                .insert({
                    platform,
                    content,
                    image_url: imageUrl,
                    published: false, // Would be true after API call
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                postId: data.id,
            };
        } catch (err) {
            Logger.error('Failed to post to social media', err, { platform, content });
            return {
                success: false,
                error: 'Erro ao postar em rede social',
            };
        }
    }

    /**
     * Auto-post popular item
     */
    async autoPostPopularItem(itemName: string, imageUrl?: string): Promise<void> {
        const platforms: ('instagram' | 'facebook' | 'twitter')[] = ['instagram', 'facebook'];
        
        for (const platform of platforms) {
            const content = `🔥 ${itemName} está em alta! Venha experimentar! #ChefIApp #Restaurante`;
            await this.postToSocialMedia(platform, content, imageUrl);
        }
    }

    /**
     * Create campaign
     */
    async createCampaign(campaign: SocialMediaCampaign): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('social_media_campaigns')
                .insert({
                    id: campaign.id,
                    name: campaign.name,
                    platforms: campaign.platforms,
                    trigger: campaign.trigger,
                    template: campaign.template,
                    enabled: campaign.enabled,
                });

            if (error) throw error;

            return { success: true };
        } catch (err) {
            // Non-blocking feature: if table doesn't exist in this environment, treat as disabled.
            const status = (err as any)?.status;
            const message = (err as any)?.message || '';
            if (status === 404 || message.includes('social_media_campaigns') || message.includes('does not exist')) {
                Logger.debug('SocialMedia disabled (missing table)', { reason: message });
                return { success: false, error: 'Módulo de redes sociais indisponível neste ambiente' };
            }
            Logger.error('Failed to create campaign', err, { campaign });
            return {
                success: false,
                error: 'Erro ao criar campanha',
            };
        }
    }

    /**
     * Get campaigns
     */
    async getCampaigns(): Promise<SocialMediaCampaign[]> {
        try {
            const { data, error } = await supabase
                .from('social_media_campaigns')
                .select('*');

            if (error) throw error;

            return (data || []).map(c => ({
                id: c.id,
                name: c.name,
                platforms: c.platforms,
                trigger: c.trigger,
                template: c.template,
                enabled: c.enabled,
            }));
        } catch (err) {
            // Non-blocking feature: if table doesn't exist in this environment, treat as disabled without noise.
            const status = (err as any)?.status;
            const message = (err as any)?.message || '';
            if (status === 404 || message.includes('social_media_campaigns') || message.includes('does not exist')) {
                Logger.debug('SocialMedia disabled (missing table)', { reason: message });
                return [];
            }
            Logger.error('Failed to get campaigns', err);
            return [];
        }
    }
}

export const socialMediaService = new SocialMediaService();
