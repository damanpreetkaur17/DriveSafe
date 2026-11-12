ALTER TABLE "Profile"
DROP COLUMN "date_of_birth",
DROP COLUMN "gender",
DROP COLUMN "address",
ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "User"
ADD COLUMN "profile_completed" BOOLEAN NOT NULL DEFAULT false;
