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

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    agreed: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    agreed: "",
  });

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

  const validate = (field?: "name" | "email" | "phone" | "agreed") => {
    const newErrors = { ...errors };

    if (!field || field === "name") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        newErrors.name = "TELL US YOUR NAME.";
      } else if (trimmedName.length < 2) {
        newErrors.name = "MUST BE 2+ SYMBOLS.";
      } else {
        newErrors.name = "";
      }
    }

    if (!field || field === "email") {
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) {
        newErrors.email = "EMAIL ADDRESS REQUIRED.";
      } else if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "INPUT A REAL EMAIL.";
      } else {
        newErrors.email = "";
      }
    }

    if (!field || field === "phone") {
      const digits = phone.replace(/\D/g, "");
      if (!digits) {
        newErrors.phone = "PHONE NUMBER REQUIRED.";
      } else if (digits.length !== 10) {
        newErrors.phone = "MUST BE EXACTLY 10 DIGITS.";
      } else {
        newErrors.phone = "";
      }
    }

    if (!field || field === "agreed") {
      if (!agreed) {
        newErrors.agreed = "TAP TO AGREE TO TEXTS/EMAILS.";
      } else {
        newErrors.agreed = "";
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

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
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.replace(/\D/g, "").length === 10 &&
    agreed;

  return (
    <div className="w-full max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000]">
      <div className="mb-6">
        <span className="text-[10px] font-black tracking-widest uppercase text-orange-500 block mb-1">
          LOCK IT IN
        </span>
        <h2 className="text-2xl font-black font-bubbles tracking-tight text-black mb-2 uppercase">
          WHO IS THIS?
        </h2>
        <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
          Tell us who you are so KJ can text you the details later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Input */}
        <div className="flex flex-col space-y-1">
          <label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-black">
            YOUR NAME
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="e.g. Jane Doe"
            disabled={isLoading}
            className={`w-full px-4 py-3 text-sm border-4 border-black transition-all font-bold placeholder:text-neutral-500 outline-none ${
              errors.name && touched.name
                ? "bg-red-200 text-black focus:bg-white"
                : "bg-black text-white focus:bg-white focus:text-black"
            }`}
          />
          {errors.name && touched.name && (
            <span className="text-[10px] text-red-500 font-extrabold mt-1">
              [X] {errors.name}
            </span>
          )}
        </div>

        {/* Email Input */}
        <div className="flex flex-col space-y-1">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-black">
            EMAIL ADDRESS
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="e.g. jane@mail.com"
            disabled={isLoading}
            className={`w-full px-4 py-3 text-sm border-4 border-black transition-all font-bold placeholder:text-neutral-500 outline-none ${
              errors.email && touched.email
                ? "bg-red-200 text-black focus:bg-white"
                : "bg-black text-white focus:bg-white focus:text-black"
            }`}
          />
          {errors.email && touched.email && (
            <span className="text-[10px] text-red-500 font-extrabold mt-1">
              [X] {errors.email}
            </span>
          )}
        </div>

        {/* Phone Input */}
        <div className="flex flex-col space-y-1">
          <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-black">
            PHONE NUMBER
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur("phone")}
            placeholder="(555) 555-5555"
            disabled={isLoading}
            className={`w-full px-4 py-3 text-sm border-4 border-black transition-all font-bold placeholder:text-neutral-500 outline-none ${
              errors.phone && touched.phone
                ? "bg-red-200 text-black focus:bg-white"
                : "bg-black text-white focus:bg-white focus:text-black"
            }`}
          />
          {errors.phone && touched.phone && (
            <span className="text-[10px] text-red-500 font-extrabold mt-1">
              [X] {errors.phone}
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
            className={`mt-0.5 w-5 h-5 min-w-[20px] border-4 border-black flex items-center justify-center transition-all focus:outline-none ${
              agreed
                ? "bg-orange-500 shadow-[2px_2px_0px_#000]"
                : "bg-white"
            }`}
          >
            {agreed && (
              <svg
                className="w-3.5 h-3.5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={4}
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
              className="text-[10px] text-neutral-800 cursor-pointer select-none leading-relaxed font-bold"
            >
              KJ CAN TEXT AND EMAIL ME TO COORDINATE THE DETAILS. RATES MAY APPLY.
            </label>
            {errors.agreed && touched.agreed && (
              <span className="text-[10px] text-red-500 font-extrabold mt-1">
                [X] {errors.agreed}
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 text-xs font-black tracking-widest uppercase transition-all border-4 border-black ${
              isFormValid && !isLoading
                ? "bg-blue-600 text-white hover:bg-orange-500 shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] cursor-pointer"
                : "bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? "SENDING DETAILS..." : "LOCK IN THE RESERVATION"}
          </button>
        </div>
      </form>
    </div>
  );
}
