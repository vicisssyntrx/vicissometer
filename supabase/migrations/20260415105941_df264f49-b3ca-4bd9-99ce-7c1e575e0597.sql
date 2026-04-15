-- Allow users to delete their own daily logs (needed for Reset All Data)
CREATE POLICY "Users can delete own logs"
ON public.daily_logs
FOR DELETE
USING (auth.uid() = user_id);
