-- =====================================================
-- TABLE: campaigns
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.campaigns`
(
  campaign_id STRING NOT NULL,
  user_id STRING,
  name STRING,
  target_criteria STRING,
  status STRING,
  lead_count INT64,
  emails_sent INT64,
  replies_received INT64,
  meetings_booked INT64,
  completed_steps INT64,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, status;


-- =====================================================
-- TABLE: communication_logs
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.communication_logs`
(
  id STRING NOT NULL,
  lead_id STRING NOT NULL,
  campaign_id STRING,
  user_id STRING,
  type STRING NOT NULL,
  direction STRING,
  status STRING NOT NULL,
  to_email STRING,
  subject STRING,
  body STRING,
  message_id STRING,
  followup_number INT64,
  reply_text STRING,
  reply_classification STRING,
  reply_confidence FLOAT64,
  summary STRING,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  event_link STRING,
  error_message STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY lead_id, type, direction;


-- =====================================================
-- TABLE: dismissed_approvals
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.dismissed_approvals`
(
  approval_id STRING,
  user_id STRING,
  dismissed_at TIMESTAMP
);


-- =====================================================
-- TABLE: followup_configs
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.followup_configs`
(
  config_id STRING NOT NULL,
  user_id STRING,
  campaign_id STRING,
  followup_1_days INT64,
  followup_2_days INT64,
  followup_3_days INT64,
  max_followups INT64,
  llm_recommended BOOL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);


-- =====================================================
-- TABLE: leads
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.leads`
(
  id STRING NOT NULL,
  name STRING,
  email STRING,
  phone STRING,
  company STRING,
  company_website STRING,
  job_role STRING,
  designation STRING,
  industry STRING,
  company_size STRING,
  geography STRING,
  linkedin_url STRING,
  company_summary STRING,
  tech_stack STRING,
  enriched_at TIMESTAMP,
  lead_status STRING,
  source STRING,
  campaign_id STRING,
  followup_count INT64,
  last_contacted TIMESTAMP,
  next_followup TIMESTAMP,
  followup_approved BOOL,
  last_reply_at TIMESTAMP,
  last_reply_classification STRING,
  last_reply_text STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY email, industry, lead_status;


-- =====================================================
-- TABLE: pending_approvals
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.pending_approvals`
(
  approval_id STRING NOT NULL,
  user_id STRING,
  campaign_id STRING,
  lead_id STRING,
  lead_name STRING,
  lead_email STRING,
  followup_number INT64,
  total_followups INT64,
  email_subject STRING,
  email_body STRING,
  scheduled_time TIMESTAMP,
  status STRING,
  approved_at TIMESTAMP,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, status;


-- =====================================================
-- TABLE: processed_gmail_messages
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.processed_gmail_messages`
(
  message_id STRING NOT NULL,
  processed_at TIMESTAMP,
  lead_email STRING,
  classification STRING
);


-- =====================================================
-- TABLE: user_profiles
-- =====================================================

CREATE TABLE `atgeir-moae-dev.leads_meta.user_profiles`
(
  user_id STRING NOT NULL,
  name STRING,
  email STRING,
  company STRING,
  product_service STRING,
  target_industry STRING,
  target_role STRING,
  target_size STRING,
  geography STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);


CREATE TABLE `atgeir-moae-dev.leads_meta.user_lead_searches` (
  user_id     STRING,
  searched_at TIMESTAMP,
  lead_ids    STRING,
  criteria    STRING
)
PARTITION BY DATE(searched_at)
CLUSTER BY user_id;


CREATE TABLE `atgeir-moae-dev.leads_meta.user_lead_status` (
  user_id     STRING NOT NULL,
  lead_id     STRING NOT NULL,
  status      STRING,  -- new/contacted/replied/closed/colds
  campaign_id STRING,
  updated_at  TIMESTAMP
)
CLUSTER BY user_id, lead_id;