-- Create default pipeline with stages
INSERT INTO "Pipeline" (id, name, description, "isDefault", "createdAt", "updatedAt")
VALUES ('default-pipeline', 'Government Contracting Pipeline', 'Default pipeline for tracking government contracting opportunities', true, NOW(), NOW());

-- Create default stages
INSERT INTO "Stage" (id, name, color, "order", "pipelineId", "createdAt", "updatedAt") VALUES
('stage-lead-gen', 'Lead Generation', '#3b82f6', 1, 'default-pipeline', NOW(), NOW()),
('stage-qualification', 'Qualification', '#f59e0b', 2, 'default-pipeline', NOW(), NOW()),
('stage-proposal', 'Proposal Development', '#8b5cf6', 3, 'default-pipeline', NOW(), NOW()),
('stage-submitted', 'Submitted/Under Review', '#06b6d4', 4, 'default-pipeline', NOW(), NOW()),
('stage-closed', 'Won/Lost/Closed', '#10b981', 5, 'default-pipeline', NOW(), NOW());

-- Insert sample opportunities for testing
INSERT INTO "Opportunity" (
  id, title, agency, "contractVehicle", "solicitationNumber", 
  "estimatedValueMin", "estimatedValueMax", "dueDate", "currentStageId",
  "naicsCodes", "setAsideType", "opportunityType", "technicalFocus",
  probability, priority, "samGovLink", "keyRequirements",
  "createdAt", "updatedAt"
) VALUES
(
  'opp-1', 
  'AI-Powered Data Analytics Platform for Defense Intelligence',
  'Department of Defense',
  'SAM.gov',
  'W52P1J-24-R-0001',
  500000,
  2000000,
  '2024-12-15 17:00:00',
  'stage-qualification',
  ARRAY['541511', '541512'],
  'SMALL_BUSINESS',
  'RFP',
  ARRAY['AI/ML', 'Data Analytics', 'Cloud Computing'],
  75,
  'HIGH',
  'https://sam.gov/opp/example1',
  'Must have Top Secret clearance, experience with AWS GovCloud, and proven AI/ML capabilities in defense sector.',
  NOW(),
  NOW()
),
(
  'opp-2',
  'Cybersecurity Assessment and Monitoring Services',
  'General Services Administration',
  'GSA Schedule',
  'GS-35F-0001AA',
  100000,
  500000,
  '2024-11-30 15:00:00',
  'stage-proposal',
  ARRAY['541690'],
  'EIGHT_A',
  'RFQ',
  ARRAY['Cybersecurity', 'Risk Assessment', 'Compliance'],
  60,
  'MEDIUM',
  'https://sam.gov/opp/example2',
  'FedRAMP certified solutions required, NIST compliance, 24/7 monitoring capabilities.',
  NOW(),
  NOW()
),
(
  'opp-3',
  'Cloud Migration and Modernization Initiative',
  'NASA',
  'SAM.gov',
  'NNH24ZDA001N',
  1000000,
  5000000,
  '2025-01-20 16:00:00',
  'stage-lead-gen',
  ARRAY['541511', '541519'],
  NULL,
  'BAA',
  ARRAY['Cloud Computing', 'DevOps', 'System Integration'],
  40,
  'HIGH',
  'https://sam.gov/opp/example3',
  'Experience with NASA systems, AWS/Azure expertise, DevSecOps implementation.',
  NOW(),
  NOW()
);
