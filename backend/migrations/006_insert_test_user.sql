-- Insert test user with inventory and tasks for testing
-- This migration assumes teams and games tables are already populated

-- Insert test user (using first available team)
-- The user will be inserted only if they don't already exist (based on slugger_user_id)
DO $$
DECLARE
  test_user_id bigint;
  test_team_id bigint;
BEGIN
  -- Get first available team
  SELECT id INTO test_team_id FROM public.teams LIMIT 1;
  
  IF test_team_id IS NULL THEN
    RAISE EXCEPTION 'No teams found in database. Please populate teams table first.';
  END IF;
  
  -- Insert user if it doesn't exist
  INSERT INTO public."user" (slugger_user_id, user_name, user_role, user_team)
  SELECT 
    'test_user_1',
    'Test User',
    'Clubhouse Manager',
    test_team_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public."user" WHERE slugger_user_id = 'test_user_1'
  )
  RETURNING id INTO test_user_id;
  
  -- If user was inserted, get the ID; otherwise get existing user ID
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM public."user" WHERE slugger_user_id = 'test_user_1';
  END IF;
  
  -- Insert inventory items for the test user's team (if they don't exist)
  INSERT INTO public.inventory (
    team_id,
    inventory_type,
    inventory_item,
    current_stock,
    required_stock,
    unit,
    purchase_link,
    note
  )
  SELECT * FROM (VALUES
    (test_team_id, 'Equipment & Field Support'::public.task_category, 'Baseballs', 45, 100, 'count', 'https://example.com/baseballs', 'Need to order more before next game'),
    (test_team_id, 'Equipment & Field Support'::public.task_category, 'Bats', 12, 15, 'count', NULL, 'Good stock level'),
    (test_team_id, 'Medical & Safety'::public.task_category, 'First Aid Kit', 2, 3, 'count', 'https://example.com/firstaid', 'One kit is almost empty'),
    (test_team_id, 'Equipment & Field Support'::public.task_category, 'Helmets', 8, 20, 'count', NULL, 'Low stock - urgent')
  ) AS v(team_id, inventory_type, inventory_item, current_stock, required_stock, unit, purchase_link, note)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory 
    WHERE inventory_item = v.inventory_item 
    AND team_id = test_team_id
  );
  
  -- Insert tasks for the test user (if they don't exist)
  INSERT INTO public.task (
    user_id,
    task_name,
    task_complete,
    task_category,
    task_description,
    task_type,
    task_date,
    task_time
  )
  SELECT * FROM (VALUES
    (test_user_id, 'Inspect field equipment', true, 'Equipment & Field Support'::public.task_category, 'Check all bases, pitching mound, and outfield', 1, CURRENT_DATE, '09:00:00'::time),
    (test_user_id, 'Restock concession stand', false, 'Meals & Nutrition'::public.task_category, 'Order snacks and drinks for weekend games', 1, CURRENT_DATE + INTERVAL '1 day', '10:00:00'::time),
    (test_user_id, 'Schedule maintenance', false, 'Equipment & Field Support'::public.task_category, 'Call maintenance team for field repairs', 2, CURRENT_DATE + INTERVAL '2 days', '14:00:00'::time),
    (test_user_id, 'Update team roster', true, 'Misc'::public.task_category, 'Add new players to system', 1, CURRENT_DATE, '11:00:00'::time)
  ) AS v(user_id, task_name, task_complete, task_category, task_description, task_type, task_date, task_time)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.task 
    WHERE task_name = v.task_name 
    AND user_id = test_user_id
  );
END $$;

