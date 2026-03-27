-- Team members table
CREATE TABLE IF NOT EXISTS team_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_id uuid NOT NULL REFERENCES healthcare_company(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'case_manager', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'deactivated')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Unique constraint: one active membership per email per HC
CREATE UNIQUE INDEX idx_unique_active_team_member 
  ON team_member(hc_id, email) 
  WHERE status != 'deactivated';

-- Team activity log
CREATE TABLE IF NOT EXISTS team_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_id uuid NOT NULL REFERENCES healthcare_company(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  actor_email text NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX idx_team_member_hc ON team_member(hc_id);
CREATE INDEX idx_team_member_user ON team_member(user_id);
CREATE INDEX idx_team_activity_hc ON team_activity_log(hc_id);
CREATE INDEX idx_team_activity_created ON team_activity_log(created_at DESC);
