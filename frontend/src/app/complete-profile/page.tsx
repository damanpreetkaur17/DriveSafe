"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { profileAPI, vehicleAPI, emergencyContactAPI } from "@/services/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const validatePersonalInfo = () => {
    if (!personalInfo.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!personalInfo.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!personalInfo.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!personalInfo.date_of_birth) {
      setError("Date of birth is required");
      return false;
    }
    return true;
  };

  const validateVehicleInfo = () => {
    if (!vehicleInfo.registration_no.trim()) {
      setError("Registration number is required");
      return false;
    }
    if (!vehicleInfo.vehicle_type.trim()) {
      setError("Vehicle type is required");
      return false;
    }
    if (!vehicleInfo.make.trim()) {
      setError("Make is required");
      return false;
    }
    if (!vehicleInfo.model.trim()) {
      setError("Model is required");
      return false;
    }
    if (!vehicleInfo.manufacturing_year) {
      setError("Manufacturing year is required");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError("");

    if (currentStep === 1 && !validatePersonalInfo()) {
      return;
    }

    if (currentStep === 2 && !validateVehicleInfo()) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkipEmergency = async () => {
    // Skip emergency contact and go to finish
    setCurrentStep(4);
  };

  const handleCompleteSetup = async () => {
    try {
      setError("");
      setIsSubmitting(true);

      // Create profile with all data including username
      await profileAPI.create(personalInfo);

      // Create vehicle
      await vehicleAPI.create(vehicleInfo);

      // Create emergency contact if provided
      if (emergencyContact.name.trim() && emergencyContact.phone.trim()) {
        await emergencyContactAPI.create(emergencyContact);
      }

      setSuccess(true);

      // Redirect to profile page after setup is saved
      setTimeout(() => {
        router.push("/dashboard/profile");
      }, 1000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete profile setup"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2A3F7E] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] text-white">
      {/* Header */}
      <div className="border-b border-[#1C232E] bg-[#05070B]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#E8EDF2]">Complete Your Profile</h1>
          <p className="text-[#8A94A6] text-sm mt-1">Set up your account to get started</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step <= currentStep
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#1C232E] text-[#5B6472]"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      step < currentStep ? "bg-[#6366F1]" : "bg-[#1C232E]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#5B6472]">
            <span>Personal</span>
            <span>Vehicle</span>
            <span>Emergency</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm">✅ Profile setup completed! Redirecting...</p>
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                value={personalInfo.username}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, username: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={personalInfo.full_name}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, full_name: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={personalInfo.phone}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Date of Birth <span className="text-red-400">*</span>
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
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Gender
              </label>
              <select
                value={personalInfo.gender}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, gender: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white focus:border-[#6366F1] focus:outline-none transition-colors"
              >
                <option value="">Select (Optional)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Address
              </label>
              <input
                type="text"
                placeholder="Enter your address (optional)"
                value={personalInfo.address}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, address: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Information */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Registration Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., ABC123XYZ"
                value={vehicleInfo.registration_no}
                onChange={(e) =>
                  setVehicleInfo({ ...vehicleInfo, registration_no: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Vehicle Type <span className="text-red-400">*</span>
              </label>
              <select
                value={vehicleInfo.vehicle_type}
                onChange={(e) =>
                  setVehicleInfo({ ...vehicleInfo, vehicle_type: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white focus:border-[#6366F1] focus:outline-none transition-colors"
              >
                <option value="">Select vehicle type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Van">Van</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                  Make <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Toyota"
                  value={vehicleInfo.make}
                  onChange={(e) =>
                    setVehicleInfo({ ...vehicleInfo, make: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                  Model <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Camry"
                  value={vehicleInfo.model}
                  onChange={(e) =>
                    setVehicleInfo({ ...vehicleInfo, model: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Manufacturing Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 2020"
                min="1990"
                max={new Date().getFullYear()}
                value={vehicleInfo.manufacturing_year}
                onChange={(e) =>
                  setVehicleInfo({
                    ...vehicleInfo,
                    manufacturing_year: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 3: Emergency Contact */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0F1419] border border-[#1C232E] rounded-lg p-4 mb-6">
              <p className="text-[#8A94A6] text-sm">
                ℹ️ <strong>Emergency contact is optional.</strong> You can skip this for now and add it later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Enter emergency contact name"
                value={emergencyContact.name}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="Enter emergency contact phone"
                value={emergencyContact.phone}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Relationship
              </label>
              <input
                type="text"
                placeholder="e.g., Father, Mother, Friend"
                value={emergencyContact.relationship}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    relationship: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white placeholder-[#5B6472] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E8EDF2] mb-2">
                Priority
              </label>
              <select
                value={emergencyContact.priority}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, priority: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#0F1419] border border-[#1C232E] rounded-lg text-white focus:border-[#6366F1] focus:outline-none transition-colors"
              >
                <option value="1">Primary</option>
                <option value="2">Secondary</option>
                <option value="3">Tertiary</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {currentStep === 4 && (
          <div className="text-center space-y-6 animate-fadeIn py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#E8EDF2]">Setup Complete!</h2>
            <p className="text-[#8A94A6]">
              Your profile is ready. Get started with the dashboard to monitor your driving.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isSubmitting}
            className="px-6 py-3 rounded-lg border border-[#1C232E] text-[#8A94A6] hover:text-white hover:border-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="flex-1" />

          {currentStep === 3 && (
            <button
              onClick={handleSkipEmergency}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg text-[#8A94A6] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg bg-[#6366F1] hover:bg-[#5558E3] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Completing..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
