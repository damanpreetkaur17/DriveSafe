-- Repair databases where the initial profile migration was applied without date_of_birth.
ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);
