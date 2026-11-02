-- Make the handle_new_user trigger more robust with exception handling
-- If profile insert fails for any reason, auth user creation still succeeds
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail auth user creation
    RAISE WARNING 'handle_new_user: could not create profile for % — %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
