-- ============================================================
-- VICISSOMETER — 003 Backend Gamification Logic
-- Idempotent setup for actual trigger-based progress
-- ============================================================

-- 1. Fix the constraints so handle_new_user ON CONFLICT DO NOTHING works correctly
ALTER TABLE habits DROP CONSTRAINT IF EXISTS unique_user_habit_name;
ALTER TABLE habits ADD CONSTRAINT unique_user_habit_name UNIQUE (user_id, name);

-- 2. Shop Purchase RPC
CREATE OR REPLACE FUNCTION purchase_kavacha(amount INT, mudra_cost INT)
RETURNS json AS $$
DECLARE
  current_mudras INT;
  new_mudras INT;
  new_kavachas INT;
BEGIN
  -- Check balance
  SELECT mudras INTO current_mudras FROM profiles WHERE id = auth.uid();
  
  IF current_mudras < mudra_cost THEN
    RAISE EXCEPTION 'Not enough Mudras! Balance: %, Cost: %', current_mudras, mudra_cost;
  END IF;

  -- Perform transaction
  UPDATE profiles
  SET mudras = mudras - mudra_cost,
      kavachas = kavachas + amount
  WHERE id = auth.uid()
  RETURNING mudras, kavachas INTO new_mudras, new_kavachas;

  -- Audit log for the purchase
  INSERT INTO gamification_ledger (user_id, asset_type, change_amount, event_type, description)
  VALUES (auth.uid(), 'KAVACHA', amount, 'SHOP_PURCHASE', 'Purchased ' || amount || ' Kavacha(s) for ' || mudra_cost || ' Mudras');

  RETURN json_build_object(
    'success', true,
    'mudras', new_mudras,
    'kavachas', new_kavachas
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Daily Progress Completion Trigger
-- When you complete a habit, you immediately get mudras added to your balance.
-- Max 10 mudras a day spread over your active habits based on weight.
CREATE OR REPLACE FUNCTION handle_progress_mudras()
RETURNS TRIGGER AS $$
DECLARE
  habit_weight FLOAT;
  earned INT;
BEGIN
  -- Get the weight of the habit
  SELECT weight INTO habit_weight FROM habits WHERE id = NEW.habit_id;
  
  -- Rough translation: 25% weight = ~2-3 mudras. We scale it so 100% = 10 mudras.
  earned := GREATEST(1, ROUND((habit_weight / 100.0) * 10));

  IF NEW.completed = TRUE AND (TG_OP = 'INSERT' OR OLD.completed = FALSE) THEN
    UPDATE profiles SET mudras = mudras + earned WHERE id = NEW.user_id;

    -- Add to Ledger
    INSERT INTO gamification_ledger (user_id, asset_type, change_amount, event_type, description)
    VALUES (NEW.user_id, 'MUDRA', earned, 'COMPLETION', 'Completed habit');

  ELSIF NEW.completed = FALSE AND TG_OP = 'UPDATE' AND OLD.completed = TRUE THEN
    UPDATE profiles SET mudras = GREATEST(0, mudras - earned) WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_progress_mudras ON daily_progress;
CREATE TRIGGER trigger_progress_mudras
  AFTER INSERT OR UPDATE ON daily_progress
  FOR EACH ROW EXECUTE FUNCTION handle_progress_mudras();
