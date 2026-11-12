ALTER TABLE "Profile"
ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "FatigueEvent"
ALTER COLUMN "confidence" DROP NOT NULL;

CREATE TABLE "DetectionSample" (
    "sample_id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "has_face" BOOLEAN NOT NULL,
    "eye_status" TEXT NOT NULL,
    "ear" DOUBLE PRECISION,
    "yawn_detected" BOOLEAN,
    "mouth_ratio" DOUBLE PRECISION,
    "head_pitch" DOUBLE PRECISION,
    "head_yaw" DOUBLE PRECISION,
    "head_roll" DOUBLE PRECISION,
    "attention_status" TEXT NOT NULL,
    "drowsiness_level" TEXT NOT NULL,
    "fatigue_score" INTEGER,

    CONSTRAINT "DetectionSample_pkey" PRIMARY KEY ("sample_id")
);

CREATE INDEX "DetectionSample_session_id_timestamp_idx"
ON "DetectionSample"("session_id", "timestamp");

CREATE INDEX "DrivingSession_user_id_status_idx"
ON "DrivingSession"("user_id", "status");

ALTER TABLE "DetectionSample"
ADD CONSTRAINT "DetectionSample_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "DrivingSession"("session_id")
ON DELETE CASCADE ON UPDATE CASCADE;
