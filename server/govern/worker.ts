/**
 * worker.ts — GovernManage Worker (Cron Job)
 * 
 * Runs periodically to:
 * 1. Sync reviews from sources
 * 2. Process reviews through NLP pipeline
 * 3. Generate insights
 * 4. Generate actions
 */

import { Pool } from 'pg';
import { syncAllReviewSources } from './google-reviews-sync';
import { processUnprocessedReviews } from './nlp-pipeline';
import { generateInsights } from './insights-generator';
import { generateActionsFromInsights } from './actions-generator';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Run full GovernManage pipeline for a restaurant
 */
export async function runGovernManagePipeline(restaurantId: string): Promise<{
  synced: number;
  processed: number;
  insights: number;
  actions: number;
}> {
  console.log(`[GovernManage] Starting pipeline for restaurant ${restaurantId}`);

  // 1. Sync reviews
  console.log(`[GovernManage] Syncing reviews...`);
  const syncResults = await syncAllReviewSources(restaurantId);
  const totalSynced = syncResults.reduce((sum, r) => sum + r.synced, 0);

  // 2. Process reviews through NLP
  console.log(`[GovernManage] Processing reviews through NLP...`);
  const processed = await processUnprocessedReviews(100);

  // 3. Generate insights (weekly window)
  console.log(`[GovernManage] Generating insights...`);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  await generateInsights(restaurantId, weekStart, now, 'weekly');

  // Get latest insight
  const insightResult = await pool.query(
    `SELECT id FROM govern_review_insights
     WHERE restaurant_id = $1
     ORDER BY window_end DESC
     LIMIT 1`,
    [restaurantId]
  );

  let actionsCreated = 0;
  if (insightResult.rows.length > 0) {
    // 4. Generate actions
    console.log(`[GovernManage] Generating actions...`);
    actionsCreated = await generateActionsFromInsights(
      restaurantId,
      insightResult.rows[0].id
    );
  }

  console.log(`[GovernManage] Pipeline complete: ${totalSynced} synced, ${processed} processed, ${actionsCreated} actions`);

  return {
    synced: totalSynced,
    processed,
    insights: insightResult.rows.length > 0 ? 1 : 0,
    actions: actionsCreated,
  };
}

/**
 * Run pipeline for all restaurants
 */
export async function runGovernManagePipelineForAll(): Promise<void> {
  const restaurants = await pool.query(
    `SELECT DISTINCT restaurant_id
     FROM govern_review_sources
     WHERE enabled = true`
  );

  for (const row of restaurants.rows) {
    try {
      await runGovernManagePipeline(row.restaurant_id);
    } catch (error: any) {
      console.error(`[GovernManage] Error processing restaurant ${row.restaurant_id}:`, error);
    }
  }
}

// CLI entry point
if (require.main === module) {
  const restaurantId = process.argv[2];
  
  if (restaurantId) {
    runGovernManagePipeline(restaurantId)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    runGovernManagePipelineForAll()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

