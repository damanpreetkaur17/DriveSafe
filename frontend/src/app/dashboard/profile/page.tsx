"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { profileAPI, vehicleAPI, emergencyContactAPI } from "@/services/api";

const emptyVehicle = {
  registration_no: "",
  vehicle_type: "",
  make: "",
  model: "",
  manufacturing_year: "",
};

const emptyEmergency = {
  name: "",
  phone: "",
  relationship: "",
  priority: "1",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    username: user?.username || "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });

  const [vehicleInfo, setVehicleInfo] = useState(emptyVehicle);
  const [emergencyContact, setEmergencyContact] = useState(emptyEmergency);
  const [existingVehicleId, setExistingVehicleId] = useState<number | null>(null);
  const [existingContactId, setExistingContactId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        setIsLoadingProfile(true);

        const profileResponse = await profileAPI.get().catch(() => null);
        if (profileResponse?.success && profileResponse.data) {
          setPersonalInfo((prev) => ({
            ...prev,
            username: profileResponse.data.username || prev.username,
            full_name: profileResponse.data.full_name || "",
            phone: profileResponse.data.phone || "",
            date_of_birth: profileResponse.data.date_of_birth
              ? new Date(profileResponse.data.date_of_birth).toISOString().slice(0, 10)
              : "",
            gender: profileResponse.data.gender || "",
            address: profileResponse.data.address || "",
          }));
        }

        const vehicleResponse = await vehicleAPI.getAll().catch(() => null);
        if (vehicleResponse?.success && Array.isArray(vehicleResponse.data) && vehicleResponse.data.length > 0) {
          const firstVehicle = vehicleResponse.data[0];
          setVehicleInfo({
            registration_no: firstVehicle.registration_no || "",
            vehicle_type: firstVehicle.vehicle_type || "",
            make: firstVehicle.make || "",
            model: firstVehicle.model || "",
            manufacturing_year: firstVehicle.manufacturing_year ? String(firstVehicle.manufacturing_year) : "",
          });
          setExistingVehicleId(firstVehicle.vehicle_id ?? null);
        } else {
          setVehicleInfo(emptyVehicle);
          setExistingVehicleId(null);
        }

        const emergencyResponse = await emergencyContactAPI.getAll().catch(() => null);
        if (emergencyResponse?.success && Array.isArray(emergencyResponse.data) && emergencyResponse.data.length > 0) {
          const firstContact = emergencyResponse.data[0];
          setEmergencyContact({
            name: firstContact.name || "",
            phone: firstContact.phone || "",
            relationship: firstContact.relationship || "",
            priority: firstContact.priority ? String(firstContact.priority) : "1",
          });
          setExistingContactId(firstContact.contact_id ?? null);
        } else {
          setEmergencyContact(emptyEmergency);
          setExistingContactId(null);
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  const validateForm = () => {
    const trimmedUsername = personalInfo.username.trim();
    const trimmedFullName = personalInfo.full_name.trim();
    const trimmedPhone = personalInfo.phone.trim();

    if (!trimmedUsername) {
      setError("Username is required.");
      return false;
    }

    if (!trimmedFullName) {
      setError("Full name is required.");
      return false;
    }

    if (!trimmedPhone) {
      setError("Phone number is required.");
      return false;
    }

    if (!vehicleInfo.registration_no.trim()) {
      setError("Registration number is required.");
      return false;
    }

    if (!vehicleInfo.vehicle_type.trim()) {
      setError("Vehicle type is required.");
      return false;
    }

    if (!vehicleInfo.make.trim()) {
      setError("Vehicle brand is required.");
      return false;
    }

    if (!vehicleInfo.model.trim()) {
      setError("Vehicle model is required.");
      return false;
    }

    if (!vehicleInfo.manufacturing_year.toString().trim()) {
      setError("Manufacturing year is required.");
      return false;
    }

    const hasEmergencyData = [
      emergencyContact.name,
      emergencyContact.phone,
      emergencyContact.relationship,
    ].some((value) => value.trim().length > 0);

    if (hasEmergencyData) {
      if (!emergencyContact.name.trim()) {
        setError("Emergency contact name is required when emergency contact is provided.");
        return false;
      }

      if (!emergencyContact.phone.trim()) {
        setError("Emergency contact phone number is required when emergency contact is provided.");
        return false;
      }

      if (!emergencyContact.relationship.trim()) {
        setError("Emergency contact relationship is required when emergency contact is provided.");
        return false;
      }
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setError("");
      setIsSaving(true);

      const profilePayload = {
        ...personalInfo,
        username: personalInfo.username.trim(),
        full_name: personalInfo.full_name.trim(),
        phone: personalInfo.phone.trim(),
        gender: personalInfo.gender || undefined,
        address: personalInfo.address.trim() || undefined,
        date_of_birth: personalInfo.date_of_birth || undefined,
      };

      await profileAPI.update(profilePayload);

      const vehiclePayload = {
        registration_no: vehicleInfo.registration_no.trim(),
        vehicle_type: vehicleInfo.vehicle_type.trim(),
        make: vehicleInfo.make.trim(),
        model: vehicleInfo.model.trim(),
        manufacturing_year: Number(vehicleInfo.manufacturing_year),
      };

      const vehicleResponse = await vehicleAPI.getAll().catch(() => null);
      const vehicleExists = vehicleResponse?.success && Array.isArray(vehicleResponse.data) && vehicleResponse.data.length > 0;
      if (vehicleExists) {
        const vehicleId = existingVehicleId ?? vehicleResponse.data[0].vehicle_id;
        await vehicleAPI.update(vehicleId, vehiclePayload);
      } else {
        await vehicleAPI.create(vehiclePayload);
      }

      const emergencyPayload = {
        name: emergencyContact.name.trim(),
        phone: emergencyContact.phone.trim(),
        relationship: emergencyContact.relationship.trim(),
        priority: Number(emergencyContact.priority || 1),
      };

      const emergencyResponse = await emergencyContactAPI.getAll().catch(() => null);
      const emergencyExists = emergencyResponse?.success && Array.isArray(emergencyResponse.data) && emergencyResponse.data.length > 0;
      const hasEmergencyData = [emergencyPayload.name, emergencyPayload.phone, emergencyPayload.relationship].some(Boolean);

      if (hasEmergencyData) {
        if (emergencyExists) {
          const contactId = existingContactId ?? emergencyResponse.data[0].contact_id;
          await emergencyContactAPI.update(contactId, emergencyPayload);
        } else {
          await emergencyContactAPI.create(emergencyPayload);
        }
      } else if (emergencyExists) {
        const contactId = existingContactId ?? emergencyResponse.data[0].contact_id;
        await emergencyContactAPI.delete(contactId);
      }

      setSuccess(true);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
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
        <div className="border-b border-white/10 bg-[#05070B]/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-[#E8EDF2]">Profile Settings</h1>
            <p className="text-[#8A94A6] text-sm mt-1">Complete and update your personal, vehicle, and emergency details.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">Profile saved successfully!</p>
            </div>
          )}

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#2A3F7E] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/70">Loading your profile...</p>
              </div>
            </div>
          ) : (
            <form
              className="space-y-8"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveProfile();
              }}
            >
              <section className="rounded-2xl border border-[#1C232E] bg-[#0B1016] p-6 shadow-lg shadow-black/10">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#E8EDF2]">Personal Information</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#8A94A6]">Required fields marked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.username}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, username: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="Choose a username"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white/60 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.full_name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={personalInfo.date_of_birth}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, date_of_birth: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Gender
                    </label>
                    <select
                      value={personalInfo.gender}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors focus:border-[#6366F1]"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                    placeholder="Enter your address (optional)"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[#1C232E] bg-[#0B1016] p-6 shadow-lg shadow-black/10">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#E8EDF2]">Vehicle Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Registration Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.registration_no}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, registration_no: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="e.g. ABC123XYZ"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Vehicle Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={vehicleInfo.vehicle_type}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_type: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors focus:border-[#6366F1]"
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Vehicle Brand <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.make}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="e.g. Toyota"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Vehicle Model <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.model}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="e.g. Camry"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Manufacturing Year <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={vehicleInfo.manufacturing_year}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, manufacturing_year: e.target.value })}
                      min="1990"
                      max={new Date().getFullYear()}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="e.g. 2020"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#1C232E] bg-[#0B1016] p-6 shadow-lg shadow-black/10">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#E8EDF2]">Emergency Contact</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#8A94A6]">Optional</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Name</label>
                    <input
                      type="text"
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Phone Number</label>
                    <input
                      type="tel"
                      value={emergencyContact.phone}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="Emergency contact phone"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Relationship</label>
                    <input
                      type="text"
                      value={emergencyContact.relationship}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors placeholder:text-[#5B6472] focus:border-[#6366F1]"
                      placeholder="e.g. Father"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Priority</label>
                    <select
                      value={emergencyContact.priority}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, priority: e.target.value })}
                      className="w-full rounded-lg border border-[#1C232E] bg-[#05070A] px-4 py-3 text-white outline-none transition-colors focus:border-[#6366F1]"
                    >
                      <option value="1">Primary</option>
                      <option value="2">Secondary</option>
                      <option value="3">Tertiary</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-[#6366F1] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5558E3] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
