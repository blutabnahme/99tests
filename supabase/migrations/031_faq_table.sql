CREATE TABLE faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'platform' CHECK (category IN ('companies', 'collectors', 'patients', 'payments', 'platform')),
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "FAQ items are viewable by everyone if published"
  ON faq FOR SELECT
  USING (is_published = true);

-- Add admin-bypass policy (already handled by service role, but just in case for authenticated admins if needed later)
-- Actually, admin routes will use service role key, so RLS doesn't block them.

INSERT INTO faq (question, answer, category, sort_order) VALUES
-- For Companies
('How do I create a case?', 'Log in to your dashboard, click ''New Case'', fill in the patient details, choose visit type and urgency level, select your matching mode, and submit. Qualified collectors in your area will be notified immediately.', 'companies', 1),
('What matching modes are available?', 'Hematch offers three modes: Patient Decides (patient chooses from all applicants), Clinic Shortlist (you review and shortlist, patient picks), and Clinic Approval (you select the collector directly).', 'companies', 2),
('How does billing work?', 'You receive a monthly invoice for all completed cases. Organization fees are €20 per practice visit and €35 per home visit. Payment terms are net 30 days.', 'companies', 3),
('Can I manage multiple locations?', 'Yes. Your dashboard supports multi-site case management from a single account.', 'companies', 4),
('How are collectors verified?', 'Every collector on Hematch undergoes identity verification, credential checks, and insurance validation before they can accept cases.', 'companies', 5),

-- For Collectors
('How do I join Hematch?', 'Visit our registration page, create your profile, upload your certifications and ID, and submit for verification. The process typically takes 1-2 business days.', 'collectors', 1),
('How do I set my rates?', 'You set your own practice visit fee and home visit fee in your profile. You can update these at any time.', 'collectors', 2),
('How does scheduling work?', 'When you apply for a case, you propose 3 time slots that work for your schedule. The patient then selects their preferred time.', 'collectors', 3),
('When do I get paid?', 'Payouts are processed after each completed collection. The platform commission is 17.5%. Funds are typically available within 2-3 business days.', 'collectors', 4),
('Can I choose which cases to accept?', 'Absolutely. You see available cases in your dashboard and decide which ones to apply for based on location, visit type, urgency, and your availability.', 'collectors', 5),

-- For Patients
('Do I need an account?', 'No. You access your case through a secure link sent by your healthcare company. No account creation is needed.', 'patients', 1),
('How do I choose a collector?', 'Depending on the matching mode set by your healthcare company, you may see all available collectors or a curated shortlist. You can review profiles, ratings, and proposed time slots before making your choice.', 'patients', 2),
('Is my data safe?', 'Yes. Hematch is GDPR-compliant and uses encryption for all data. Your health information is only shared with the parties directly involved in your case.', 'patients', 3),
('What if I need to reschedule?', 'Contact your healthcare company to discuss rescheduling options. Depending on the case status, new time slots may be proposed.', 'patients', 4),

-- Payments
('What payment methods are accepted?', 'We currently support major credit and debit cards. Additional payment methods will be added soon.', 'payments', 1),
('Are there any hidden fees?', 'No. All pricing is transparent. Healthcare companies see their org fees, collectors see the commission rate, and patients see the total cost before confirming.', 'payments', 2),
('How do refunds work?', 'Refunds are handled on a case-by-case basis. If a collection cannot be completed, contact support@hematch.com.', 'payments', 3),

-- Platform
('Is Hematch available in my area?', 'Hematch currently operates across Germany. We are planning expansion to other EU countries.', 'platform', 1),
('Is Hematch GDPR compliant?', 'Yes. We are fully GDPR-compliant with data stored in EU data centers (Frankfurt, Germany). See our Privacy Policy for details.', 'platform', 2),
('How do I contact support?', 'Email us at support@hematch.com or visit our Contact page. We typically respond within 24 hours.', 'platform', 3),
('Can I integrate Hematch with my systems?', 'Yes. We offer a REST API for healthcare companies. Visit our API documentation for details.', 'platform', 4);
