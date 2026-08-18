"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { profileAPI, vehicleAPI, emergencyContactAPI } from "@/services/api";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "vehicle" | "emergency">("personal");

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    username: user?.username || "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    registration_no: "",
    vehicle_type: "",
    make: "",
    model: "",
    manufacturing_year: "",
  });

  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
    relationship: "",
    priority: "1",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileResponse = await profileAPI.get();
        if (profileResponse.success && profileResponse.data) {
          setPersonalInfo((prev) => ({
            ...prev,
            ...profileResponse.data,
          }));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  const handleSavePersonal = async () => {
    try {
      setError("");
      setIsSaving(true);

      await profileAPI.update(personalInfo);
      setSuccess(true);
      setEditMode(false);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#2A3F7E] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="min-h-screen bg-[#05070B] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#05070B]/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#E8EDF2]">Profile Settings</h1>
                <p className="text-[#8A94A6] text-sm mt-1">Manage your account and personal information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">Profile updated successfully!</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8 flex gap-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab("personal")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "personal"
                  ? "text-white border-b-2 border-[#6366F1] -mb-px"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab("vehicle")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "vehicle"
                  ? "text-white border-b-2 border-[#6366F1] -mb-px"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Vehicle Details
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "emergency"
                  ? "text-white border-b-2 border-[#6366F1] -mb-px"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Emergency Contact
            </button>
          </div>

          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={personalInfo.username}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, username: e.target.value })
                    }
                    disabled={!editMode}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white/50 disabled:cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={personalInfo.full_name}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, full_name: e.target.value })
                    }
                    disabled={!editMode}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, phone: e.target.value })
                    }
                    disabled={!editMode}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={personalInfo.date_of_birth}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        date_of_birth: e.target.value,
                      })
                    }
                    disabled={!editMode}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Gender
                  </label>
                  <select
                    value={personalInfo.gender}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, gender: e.target.value })
                    }
                    disabled={!editMode}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Address
                </label>
                <textarea
                  value={personalInfo.address}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, address: e.target.value })
                  }
                  disabled={!editMode}
                  rows={3}
                  className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-white/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#6366F1]/80 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSavePersonal}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#6366F1]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-6 py-2 bg-[#1C232E] text-white rounded-lg hover:bg-[#2A3340] transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Details Tab */}
          {activeTab === "vehicle" && (
            <div className="text-center py-12">
              <p className="text-white/50">Vehicle details will be available soon</p>
            </div>
          )}

          {/* Emergency Contact Tab */}
          {activeTab === "emergency" && (
            <div className="text-center py-12">
              <p className="text-white/50">Emergency contact details will be available soon</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
