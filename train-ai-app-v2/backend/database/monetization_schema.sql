-- ============================================================
-- trAIn Monetization Schema
-- All 6 revenue strategies with admin toggle support
-- ============================================================

-- -----------------------------------------------
-- STRATEGY TOGGLES TABLE (Admin Controls)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS monetization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_key VARCHAR(50) UNIQUE NOT NULL,
    strategy_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}',
    enabled_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Insert all 6 strategies (all OFF by default)
INSERT INTO monetization_settings (strategy_key, strategy_name, is_enabled, config, notes) VALUES
(
    'platform_commission',
    'Platform Commission',
    TRUE,
    '{
        "commission_rate": 0.20,
        "min_commission": 0.01,
        "description": "20% cut of every task transaction"
    }',
    'Strategy 1 - Primary revenue. Active from day 1.'
),
(
    'company_subscriptions',
    'Company Subscription Plans',
    FALSE,
    '{
        "plans": [
            {"name": "Starter", "price_monthly": 99,  "tasks_included": 500,  "extra_task_rate": 0.25},
            {"name": "Growth",  "price_monthly": 299, "tasks_included": 2000, "extra_task_rate": 0.20},
            {"name": "Business","price_monthly": 799, "tasks_included": 10000,"extra_task_rate": 0.15},
            {"name": "Enterprise","price_monthly": 0, "tasks_included": -1,  "extra_task_rate": 0.00}
        ],
        "description": "Monthly subscription plans for companies"
    }',
    'Strategy 2 - Enable Month 3-4 when you have 5+ companies.'
),
(
    'premium_trainers',
    'Premium Trainer Accounts',
    FALSE,
    '{
        "tiers": [
            {"name": "Free",  "price_monthly": 0,     "payment_bonus": 0,    "withdrawal_days": 7,  "features": ["Standard tasks"]},
            {"name": "Pro",   "price_monthly": 9.99,  "payment_bonus": 0.10, "withdrawal_days": 2,  "features": ["Priority access", "+10% bonus", "48hr withdrawal", "Email support", "Advanced analytics"]},
            {"name": "Elite", "price_monthly": 24.99, "payment_bonus": 0.25, "withdrawal_days": 0,  "features": ["Exclusive tasks", "+25% bonus", "Instant withdrawal", "Dedicated support", "Full dashboard"]}
        ],
        "description": "Premium tiers for power trainers"
    }',
    'Strategy 3 - Enable Month 5-6 when you have 100+ active trainers.'
),
(
    'data_quality_guarantee',
    'Data Quality Guarantee',
    FALSE,
    '{
        "tiers": [
            {"name": "Standard",      "multiplier": 1.0, "reviewers": 1, "description": "Basic review"},
            {"name": "Quality Assured","multiplier": 1.5, "reviewers": 3, "description": "3 trainers review same task"},
            {"name": "Gold Standard", "multiplier": 2.0, "reviewers": 5, "description": "5 trainers + AI verification"}
        ],
        "description": "Premium accuracy tiers for companies"
    }',
    'Strategy 4 - Enable Month 4-5 alongside subscriptions.'
),
(
    'api_access',
    'API Access for Companies',
    FALSE,
    '{
        "tiers": [
            {"name": "Developer", "price_monthly": 49,  "calls_monthly": 10000,   "description": "For small teams"},
            {"name": "Business",  "price_monthly": 199, "calls_monthly": 100000,  "description": "For growing companies"},
            {"name": "Enterprise","price_monthly": 999, "calls_monthly": -1,      "description": "Unlimited API access"}
        ],
        "description": "API access for companies to integrate trAIn"
    }',
    'Strategy 5 - Enable Month 7+ for enterprise clients.'
),
(
    'featured_listings',
    'Featured Task Listings',
    FALSE,
    '{
        "tiers": [
            {"name": "Standard",  "price": 0,   "description": "Normal queue position"},
            {"name": "Featured",  "price": 29,  "description": "Shown at top of task list"},
            {"name": "Urgent",    "price": 99,  "description": "Push notifications to all trainers"}
        ],
        "description": "Companies pay to promote their tasks"
    }',
    'Strategy 6 - Enable Month 4+ once you have 200+ trainers.'
)
ON CONFLICT (strategy_key) DO NOTHING;

-- -----------------------------------------------
-- SUBSCRIPTION PLANS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('company', 'trainer')),
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    stripe_price_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Plans
INSERT INTO subscription_plans (plan_type, name, price_monthly, price_yearly, features, limits) VALUES
('company', 'Starter',    99,   990,   '["500 tasks/month","Basic analytics","Email support","Standard quality"]', '{"tasks_monthly": 500,  "extra_task_rate": 0.25}'),
('company', 'Growth',     299,  2990,  '["2000 tasks/month","Advanced analytics","Priority support","Quality assured"]', '{"tasks_monthly": 2000, "extra_task_rate": 0.20}'),
('company', 'Business',   799,  7990,  '["10000 tasks/month","Full analytics","Dedicated support","Gold standard quality","API access"]', '{"tasks_monthly": 10000,"extra_task_rate": 0.15}'),
('company', 'Enterprise', 0,    0,     '["Unlimited tasks","Custom analytics","Account manager","Custom quality SLA","Full API access","Custom integrations"]', '{"tasks_monthly": -1,   "extra_task_rate": 0.00}')
ON CONFLICT DO NOTHING;

-- Trainer Plans
INSERT INTO subscription_plans (plan_type, name, price_monthly, price_yearly, features, limits) VALUES
('trainer', 'Free',  0,     0,    '["Standard tasks","Basic earnings","Weekly withdrawal","Basic stats"]', '{"payment_bonus": 0,    "withdrawal_days": 7}'),
('trainer', 'Pro',   9.99,  99,   '["Priority task access","+10% payment bonus","48hr withdrawal","Email support","Advanced analytics","Performance badges"]', '{"payment_bonus": 0.10, "withdrawal_days": 2}'),
('trainer', 'Elite', 24.99, 249,  '["Exclusive high-paying tasks","+25% payment bonus","Instant withdrawal","Dedicated support","Full dashboard","Leaderboard boost","Early access to new task types"]', '{"payment_bonus": 0.25, "withdrawal_days": 0}')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- USER SUBSCRIPTIONS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','past_due')),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    tasks_used_this_period INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(user_id)
);

-- -----------------------------------------------
-- COMMISSION TRANSACTIONS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id),
    task_id UUID REFERENCES tasks(id),
    client_id UUID REFERENCES users(id),
    trainer_id UUID REFERENCES users(id),
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    trainer_payout DECIMAL(10,2) NOT NULL,
    strategy_applied VARCHAR(50) DEFAULT 'platform_commission',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- FEATURED LISTINGS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS featured_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    listing_tier VARCHAR(20) NOT NULL CHECK (listing_tier IN ('standard','featured','urgent')),
    price_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- API KEYS TABLE (for API Access strategy)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('developer','business','enterprise')),
    calls_this_month INTEGER DEFAULT 0,
    calls_limit INTEGER DEFAULT 10000,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- PLATFORM REVENUE SUMMARY VIEW
-- -----------------------------------------------
CREATE OR REPLACE VIEW platform_revenue_summary AS
SELECT
    DATE_TRUNC('month', ct.created_at) AS month,
    COUNT(ct.id) AS total_transactions,
    SUM(ct.gross_amount) AS gross_volume,
    SUM(ct.commission_amount) AS commission_revenue,
    SUM(ct.trainer_payout) AS trainer_payouts,
    AVG(ct.commission_rate) AS avg_commission_rate
FROM commission_transactions ct
GROUP BY DATE_TRUNC('month', ct.created_at)
ORDER BY month DESC;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_created ON commission_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_featured_listings_task_id ON featured_listings(task_id);
CREATE INDEX IF NOT EXISTS idx_featured_listings_active ON featured_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
