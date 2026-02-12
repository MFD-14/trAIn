const db = require('../config/database');

// Cache settings for 5 minutes to avoid DB hit on every request
let settingsCache = null;
let cacheExpiry = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getMonetizationSettings = async () => {
  const now = Date.now();
  if (settingsCache && cacheExpiry && now < cacheExpiry) {
    return settingsCache;
  }

  const result = await db.query(
    'SELECT strategy_key, is_enabled, config FROM monetization_settings'
  );

  const settings = {};
  result.rows.forEach(row => {
    settings[row.strategy_key] = {
      enabled: row.is_enabled,
      config: row.config
    };
  });

  settingsCache = settings;
  cacheExpiry = now + CACHE_TTL;
  return settings;
};

// Invalidate cache when settings change
const invalidateCache = () => {
  settingsCache = null;
  cacheExpiry = null;
};

// Middleware: calculate commission based on active strategy
const applyCommission = async (grossAmount, trainerId) => {
  const settings = await getMonetizationSettings();
  const commissionConfig = settings['platform_commission'];

  if (!commissionConfig?.enabled) {
    return { commissionRate: 0, commissionAmount: 0, trainerPayout: grossAmount };
  }

  // Check if trainer has premium subscription (bonus payout)
  let bonusRate = 0;
  const trainerSub = await db.query(
    `SELECT sp.limits FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = $1 AND us.status = 'active'`,
    [trainerId]
  );

  if (trainerSub.rows.length > 0) {
    const limits = trainerSub.rows[0].limits;
    bonusRate = parseFloat(limits.payment_bonus) || 0;
  }

  const baseRate = parseFloat(commissionConfig.config.commission_rate) || 0.20;
  const effectiveCommissionRate = Math.max(0, baseRate - bonusRate);
  const commissionAmount = grossAmount * effectiveCommissionRate;
  const trainerPayout = grossAmount - commissionAmount;

  return {
    commissionRate: effectiveCommissionRate,
    commissionAmount: parseFloat(commissionAmount.toFixed(2)),
    trainerPayout: parseFloat(trainerPayout.toFixed(2))
  };
};

// Middleware: get task payment multiplier for quality guarantee
const getQualityMultiplier = async (qualityTier) => {
  const settings = await getMonetizationSettings();
  const qualityConfig = settings['data_quality_guarantee'];

  if (!qualityConfig?.enabled || !qualityTier) {
    return { multiplier: 1.0, reviewers: 1 };
  }

  const tier = qualityConfig.config.tiers?.find(
    t => t.name.toLowerCase() === qualityTier.toLowerCase()
  );

  return tier ? { multiplier: tier.multiplier, reviewers: tier.reviewers } : { multiplier: 1.0, reviewers: 1 };
};

// Middleware: get featured listing boost
const getFeaturedBoost = async (taskId) => {
  const settings = await getMonetizationSettings();
  const featuredConfig = settings['featured_listings'];

  if (!featuredConfig?.enabled) return { isFeatured: false, isUrgent: false, tier: 'standard' };

  const listing = await db.query(
    `SELECT listing_tier FROM featured_listings
     WHERE task_id = $1 AND is_active = TRUE AND expires_at > NOW()
     ORDER BY listing_tier DESC LIMIT 1`,
    [taskId]
  );

  if (listing.rows.length === 0) return { isFeatured: false, isUrgent: false, tier: 'standard' };

  const tier = listing.rows[0].listing_tier;
  return {
    isFeatured: tier === 'featured' || tier === 'urgent',
    isUrgent: tier === 'urgent',
    tier
  };
};

// Check if user can access premium features
const checkSubscriptionAccess = async (userId, feature) => {
  const sub = await db.query(
    `SELECT sp.name, sp.limits, sp.features FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = $1 AND us.status = 'active'`,
    [userId]
  );

  if (sub.rows.length === 0) return { hasAccess: false, plan: 'Free' };

  const plan = sub.rows[0];
  const features = plan.features || [];
  const hasAccess = features.some(f =>
    f.toLowerCase().includes(feature.toLowerCase())
  );

  return { hasAccess, plan: plan.name, limits: plan.limits };
};

module.exports = {
  getMonetizationSettings,
  invalidateCache,
  applyCommission,
  getQualityMultiplier,
  getFeaturedBoost,
  checkSubscriptionAccess
};
