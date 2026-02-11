-- trAIn Database Schema
-- PostgreSQL Database for AI Training Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'client', 'admin')),
    phone_number VARCHAR(20),
    accuracy_rating DECIMAL(5,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    tasks_completed INTEGER DEFAULT 0,
    preferred_language VARCHAR(10) DEFAULT 'en',
    skill_categories TEXT[],
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table (Extended information for companies)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255),
    industry VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_tasks_posted INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
        'image_labeling',
        'text_classification', 
        'audio_transcription',
        'data_validation',
        'sentiment_analysis',
        'entity_recognition',
        'question_answering'
    )),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    payment_per_task DECIMAL(6,2) NOT NULL,
    estimated_time_minutes INTEGER NOT NULL,
    total_tasks INTEGER NOT NULL,
    completed_tasks INTEGER DEFAULT 0,
    required_accuracy DECIMAL(5,2) DEFAULT 90.00,
    instructions TEXT,
    dataset_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    result_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN (
        'pending_review',
        'approved',
        'rejected',
        'flagged'
    )),
    accuracy_score DECIMAL(5,2),
    payment_amount DECIMAL(6,2),
    time_spent_seconds INTEGER NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    UNIQUE(task_id, user_id, created_at)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earning', 'withdrawal', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    stripe_transaction_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_difficulty ON tasks(difficulty);
CREATE INDEX idx_submissions_task_id ON submissions(task_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create Trigger Functions for Updated_At Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data for Testing
-- Sample Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password, first_name, last_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', '$2b$10$rZ5L6GxXxJxvKXvXxJxvKOy0YvYvYvYvYvYvYvYvYvYvYvYvY', 'John', 'Doe', 'user'),
    ('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@example.com', '$2b$10$rZ5L6GxXxJxvKXvXxJxvKOy0YvYvYvYvYvYvYvYvYvYvYvYvY', 'Jane', 'Smith', 'user'),
    ('550e8400-e29b-41d4-a716-446655440002', 'acme.corp@example.com', '$2b$10$rZ5L6GxXxJxvKXvXxJxvKOy0YvYvYvYvYvYvYvYvYvYvYvYvY', 'ACME', 'Corporation', 'client')
ON CONFLICT (email) DO NOTHING;

-- Sample Client
INSERT INTO clients (id, company_name, company_website, industry) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'ACME Corporation', 'https://acme.com', 'Technology')
ON CONFLICT (id) DO NOTHING;

-- Sample Tasks
INSERT INTO tasks (id, client_id, title, description, task_type, difficulty, payment_per_task, estimated_time_minutes, total_tasks, instructions) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440002',
        'Label Retail Products',
        'Draw bounding boxes around products in retail store images',
        'image_labeling',
        'easy',
        0.15,
        2,
        1000,
        'Please draw a bounding box around each product and label it with the product category (e.g., cereal, milk, juice)'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        'Classify Customer Reviews',
        'Categorize customer reviews by sentiment and topic',
        'text_classification',
        'medium',
        0.30,
        5,
        500,
        'Read each review and classify it by: 1) Sentiment (positive/negative/neutral) 2) Main topic (product quality, shipping, customer service, price)'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440002',
        'Transcribe Medical Dictations',
        'Convert audio recordings of medical dictations to text',
        'audio_transcription',
        'hard',
        1.00,
        10,
        200,
        'Listen carefully to each audio file and transcribe the medical dictation accurately. Include all medical terminology and proper formatting.'
    )
ON CONFLICT (id) DO NOTHING;

-- Views for Analytics
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.accuracy_rating,
    u.total_earnings,
    u.tasks_completed,
    COUNT(DISTINCT s.task_id) as unique_tasks_worked,
    AVG(s.accuracy_score) as avg_accuracy,
    SUM(s.time_spent_seconds) as total_time_spent
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'approved'
WHERE u.role = 'user'
GROUP BY u.id, u.email, u.first_name, u.last_name, u.accuracy_rating, u.total_earnings, u.tasks_completed;

CREATE OR REPLACE VIEW task_completion_stats AS
SELECT 
    t.id,
    t.title,
    t.task_type,
    t.total_tasks,
    t.completed_tasks,
    (t.completed_tasks::DECIMAL / NULLIF(t.total_tasks, 0) * 100) as completion_percentage,
    COUNT(DISTINCT s.user_id) as unique_contributors,
    AVG(s.accuracy_score) as avg_accuracy
FROM tasks t
LEFT JOIN submissions s ON t.id = s.task_id AND s.status = 'approved'
GROUP BY t.id, t.title, t.task_type, t.total_tasks, t.completed_tasks;

-- Grant Permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
