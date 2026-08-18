-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "user_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "vehicle_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "registration_no" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturing_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "contact_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "DrivingSession" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrivingSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "FatigueEventType" (
    "event_type_id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FatigueEventType_pkey" PRIMARY KEY ("event_type_id")
);

-- CreateTable
CREATE TABLE "FatigueEvent" (
    "event_id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "snapshot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FatigueEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "alert_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "alert_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("alert_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registration_no_key" ON "Vehicle"("registration_no");

-- CreateIndex
CREATE INDEX "Vehicle_user_id_idx" ON "Vehicle"("user_id");

-- CreateIndex
CREATE INDEX "EmergencyContact_user_id_idx" ON "EmergencyContact"("user_id");

-- CreateIndex
CREATE INDEX "DrivingSession_user_id_idx" ON "DrivingSession"("user_id");

-- CreateIndex
CREATE INDEX "DrivingSession_vehicle_id_idx" ON "DrivingSession"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "FatigueEventType_event_name_key" ON "FatigueEventType"("event_name");

-- CreateIndex
CREATE INDEX "FatigueEvent_session_id_idx" ON "FatigueEvent"("session_id");

-- CreateIndex
CREATE INDEX "FatigueEvent_event_type_id_idx" ON "FatigueEvent"("event_type_id");

-- CreateIndex
CREATE INDEX "Alert_event_id_idx" ON "Alert"("event_id");

-- CreateIndex
CREATE INDEX "Alert_contact_id_idx" ON "Alert"("contact_id");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingSession" ADD CONSTRAINT "DrivingSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingSession" ADD CONSTRAINT "DrivingSession_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FatigueEvent" ADD CONSTRAINT "FatigueEvent_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "DrivingSession"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FatigueEvent" ADD CONSTRAINT "FatigueEvent_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "FatigueEventType"("event_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "FatigueEvent"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "EmergencyContact"("contact_id") ON DELETE SET NULL ON UPDATE CASCADE;
