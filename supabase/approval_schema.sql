-- TransitOps - Database Schema Alterations for Admin Approval Workflow

-- 1. Modify Role check constraint to allow new roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN (
    'Administrator', 
    'Fleet Manager', 
    'Dispatcher', 
    'Safety Officer', 
    'Financial Analyst',
    'Driver',
    'Maintenance Manager',
    'Viewer',
    'Security'
));

-- 2. Add approval fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending Approval' CHECK (approval_status IN (
    'Pending Approval',
    'Approved',
    'Rejected',
    'Suspended',
    'Inactive',
    'Information Required'
));

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registration_ip TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_information TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS browser_information TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS requested_fields_to_edit TEXT[];

-- Set existing pre-seeded users to 'Approved'
UPDATE public.users SET approval_status = 'Approved' WHERE approval_status IS NULL;

-- 3. Create UserApprovalHistory Table
CREATE TABLE IF NOT EXISTS public.user_approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    administrator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('Approve', 'Reject', 'Suspend', 'Reactivate', 'Request Info')),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT
);

-- Enable RLS on new table
ALTER TABLE public.user_approval_history ENABLE ROW LEVEL SECURITY;

-- Select/Read Policies for history
CREATE POLICY "Allow read user approval history for authenticated users" ON public.user_approval_history FOR SELECT USING (true);
CREATE POLICY "Allow write user approval history for authenticated users" ON public.user_approval_history FOR ALL USING (true);
