"use client";

import React, { useState, useEffect } from "react";

export interface LeadCaptureFormData {
  name: string;
  email: string;
  phone: string;
}

export interface LeadCaptureFormProps {
  onSubmit: (data: LeadCaptureFormData) => void;
  isLoading?: boolean;
}

export default function LeadCaptureForm({ onSubmit, isLoading = false }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Track touch / interaction states for validation feedback
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    agreed: false,
  });

  // Track client-side validation errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    agreed: "",
  });

  // Perform dynamic formatting for phone input (e.g. (XXX) XXX-XXXX)
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return cleaned;

    const [, p1, p2, p3] = match;
    if (cleaned.length <= 3) return p1 ? `(${p1}` : "";
    if (cleaned.length <= 6) return `(${p1}) ${p2}`;
    return `(${p1}) ${p2}-${p3}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhone(input);
    setPhone(formatted);
  };

  // Run validation checks
  const validate = (field?: "name" | "email" | "phone" | "agreed") => {
    const newErrors = { ...errors };

    if (!field || field === "name") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        newErrors.name = "Full name is required.";
      } else if (trimmedName.length < 2) {
        newErrors.name = "Name must be at least 2 characters.";
      } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
        newErrors.name = "Name can only contain letters, spaces, hyphens, or apostrophes.";
      } else {
        newErrors.name = "";
      }
    }

    if (!field || field === "email") {
      const trimmedEmail = email.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!trimmedEmail) {
        newErrors.email = "Email address is required.";
      } else if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address.";
      } else {
        newErrors.email = "";
      }
    }

    if (!field || field === "phone") {
      const digits = phone.replace(/\D/g, "");
      if (!digits) {
        newErrors.phone = "Phone number is required.";
      } else if (digits.length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits.";
      } else {
        newErrors.phone = "";
      }
    }

    if (!field || field === "agreed") {
      if (!agreed) {
        newErrors.agreed = "Consent verification is required to proceed.";
      } else {
        newErrors.agreed = "";
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Trigger real-time error clearance/validation when fields change
  useEffect(() => {
    if (touched.name) validate("name");
  }, [name]);

  useEffect(() => {
    if (touched.email) validate("email");
  }, [email]);

  useEffect(() => {
    if (touched.phone) validate("phone");
  }, [phone]);

  useEffect(() => {
    if (touched.agreed) validate("agreed");
  }, [agreed]);

  const handleBlur = (field: "name" | "email" | "phone") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set all fields to touched to display any missed validation errors
    setTouched({
      name: true,
      email: true,
      phone: true,
      agreed: true,
    });

    const validationErrors = validate();
    const hasErrors = Object.values(validationErrors).some((err) => err !== "");

    if (!hasErrors) {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
      });
    }
  };

  const isFormValid =
    name.trim().length >= 2 &&
    /^[a-zA-Z\s'-]+$/.test(name.trim()) &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) &&
    phone.replace(/\D/g, "").length === 10 &&
    agreed;

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-neutral-200/80 p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.015)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      <div className="mb-8">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-neutral-400 block mb-2">
          Identity Vault
        </span>
        <h2 className="text-2xl font-light text-neutral-900 tracking-tight mb-3">
          Lock in your selection
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed font-light">
          To display your personalized date itinerary and coordinate scheduling, 
          please secure your details below. Captured data is programmatically isolated.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div className="flex flex-col space-y-1.5">
          <label
            htmlFor="name"
            className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 transition-colors duration-300"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="e.g. Jane Doe"
            disabled={isLoading}
            className={`w-full px-3.5 py-3 text-sm bg-white border rounded-none transition-all duration-300 placeholder:text-neutral-300 focus:outline-none focus:ring-1 ${
              errors.name && touched.name
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/5"
            }`}
          />
          {errors.name && touched.name && (
            <span className="text-[11px] text-red-500 font-light mt-1">
              {errors.name}
            </span>
          )}
        </div>

        {/* Email Input */}
        <div className="flex flex-col space-y-1.5">
          <label
            htmlFor="email"
            className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 transition-colors duration-300"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="e.g. jane@domain.com"
            disabled={isLoading}
            className={`w-full px-3.5 py-3 text-sm bg-white border rounded-none transition-all duration-300 placeholder:text-neutral-300 focus:outline-none focus:ring-1 ${
              errors.email && touched.email
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/5"
            }`}
          />
          {errors.email && touched.email && (
            <span className="text-[11px] text-red-500 font-light mt-1">
              {errors.email}
            </span>
          )}
        </div>

        {/* Phone Input */}
        <div className="flex flex-col space-y-1.5">
          <label
            htmlFor="phone"
            className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 transition-colors duration-300"
          >
            Contact Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur("phone")}
            placeholder="(555) 555-5555"
            disabled={isLoading}
            className={`w-full px-3.5 py-3 text-sm bg-white border rounded-none transition-all duration-300 placeholder:text-neutral-300 focus:outline-none focus:ring-1 ${
              errors.phone && touched.phone
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/5"
            }`}
          />
          {errors.phone && touched.phone && (
            <span className="text-[11px] text-red-500 font-light mt-1">
              {errors.phone}
            </span>
          )}
        </div>

        {/* Legal Consent Box */}
        <div className="flex items-start pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setAgreed(!agreed);
              setTouched((prev) => ({ ...prev, agreed: true }));
            }}
            className={`mt-0.5 w-4 h-4 min-w-[16px] rounded-none border flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none ${
              agreed
                ? "bg-neutral-900 border-neutral-900"
                : errors.agreed && touched.agreed
                ? "bg-white border-red-400"
                : "bg-white border-neutral-300 hover:border-neutral-400 focus:ring-1 focus:ring-neutral-900/5"
            }`}
          >
            {agreed && (
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex flex-col ml-3">
            <label
              onClick={() => {
                if (!isLoading) {
                  setAgreed(!agreed);
                  setTouched((prev) => ({ ...prev, agreed: true }));
                }
              }}
              className="text-[11px] text-neutral-500 cursor-pointer select-none leading-relaxed font-light"
            >
              By checking this box and clicking submit, I authorize KJ to contact me 
              via SMS/text message and email to coordinate date logistics. Consent 
              is electronic and not a condition of purchase. Message and data rates may apply.
            </label>
            {errors.agreed && touched.agreed && (
              <span className="text-[11px] text-red-500 font-light mt-1">
                {errors.agreed}
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border ${
              isFormValid && !isLoading
                ? "bg-neutral-900 text-white border-neutral-900 hover:bg-white hover:text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                : "bg-neutral-100 text-neutral-400 border-neutral-100 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Transmitting Data...</span>
              </span>
            ) : (
              "Lock In Reservation"
            )}
          </button>
        </div>
      </form>

      {/* Security Footer Notice */}
      <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-center space-x-2 text-[9px] text-neutral-400 font-light tracking-wide uppercase">
        <svg
          className="w-3 h-3 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span>TLS Encryption Active • Programmatic Cryptographic Isolation</span>
      </div>
    </div>
  );
}
