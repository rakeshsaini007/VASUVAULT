import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { CategorySchema } from "../types";

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategorySchema;
  initialData?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  isSaving: boolean;
}

export default function CardFormModal({
  isOpen,
  onClose,
  category,
  initialData,
  onSave,
  isSaving
}: CardFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      const processed: Record<string, any> = { ...initialData };
      category.fields.forEach(f => {
        if ((f.key === "Name" || f.key === "AccountHolderName" || f.key === "CardHolderName" || f.key === "PanNumber") && processed[f.key]) {
          processed[f.key] = String(processed[f.key]).toUpperCase();
        }
      });
      setFormData(processed);
    } else {
      // Initialize with empty strings for all fields
      const initial: Record<string, any> = {};
      category.fields.forEach(f => {
        initial[f.key] = f.type === "select" && f.options ? f.options[0] : "";
      });
      setFormData(initial);
    }
    setErrors({});
    setGeneralError("");
  }, [initialData, category, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (key: string, value: string) => {
    let finalValue = value;
    if (key === "Name" || key === "AccountHolderName" || key === "CardHolderName" || key === "PanNumber") {
      finalValue = value.toUpperCase();
    }
    if (key === "CVV") {
      const digitsOnly = value.replace(/\D/g, "");
      finalValue = digitsOnly.slice(0, 3);
    }
    if (key === "PIN") {
      finalValue = value.replace(/\D/g, "");
    }
    if (key === "Expiry") {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 2) {
        finalValue = digits.slice(0, 2) + "/" + digits.slice(2, 4);
      } else {
        finalValue = digits;
      }
    }
    setFormData(prev => ({ ...prev, [key]: finalValue }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleBlur = (key: string, value: string) => {
    const isEmailField = 
      category.fields.find(f => f.key === key)?.type === "email" ||
      key.toLowerCase().includes("email") ||
      (category.id === "media" && key === "Userid");

    if (isEmailField && value.trim() !== "") {
      const trimmed = value.trim();
      if (!trimmed.includes("@")) {
        const finalValue = `${trimmed}@gmail.com`;
        setFormData(prev => ({ ...prev, [key]: finalValue }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Auto-complete email inputs with @gmail.com if they don't contain @
    const processedData = { ...formData };
    category.fields.forEach(f => {
      const val = processedData[f.key];
      const isEmailField = 
        f.type === "email" || 
        f.key.toLowerCase().includes("email") || 
        (category.id === "media" && f.key === "Userid");

      if (isEmailField && val !== undefined && String(val).trim() !== "") {
        const trimmed = String(val).trim();
        if (!trimmed.includes("@")) {
          processedData[f.key] = `${trimmed}@gmail.com`;
        }
      }
    });

    setFormData(processedData);

    category.fields.forEach(f => {
      const val = processedData[f.key];
      const hasValue = val !== undefined && String(val).trim() !== "";

      if (f.required && !hasValue) {
        newErrors[f.key] = `${f.label} is required`;
        return;
      }

      if (hasValue) {
        // Name, AccountHolderName, CardHolderName: must be in uppercase
        if (f.key === "Name" || f.key === "AccountHolderName" || f.key === "CardHolderName") {
          const rawVal = String(val);
          if (/[a-z]/.test(rawVal)) {
            newErrors[f.key] = `${f.label} must be in uppercase letters only.`;
          }
        }

        // CVV Number: must be exactly three digits
        if (f.key === "CVV") {
          const cleanCVV = String(val).trim();
          if (!/^\d{3}$/.test(cleanCVV)) {
            newErrors[f.key] = "CVV must be exactly three digits.";
          }
        }

        // PIN Number: must consist of digits only
        if (f.key === "PIN") {
          const cleanPIN = String(val).trim();
          if (!/^\d+$/.test(cleanPIN)) {
            newErrors[f.key] = "PIN must consist of digits only.";
          }
        }

        // Expiry Date: must be MM/YY format
        if (f.key === "Expiry") {
          const cleanExpiry = String(val).trim();
          if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cleanExpiry)) {
            newErrors[f.key] = 'Expiry should be in format of "MM/YY".';
          }
        }

        // Aadhaar Number: Exactly 12 digits
        if (f.key === "AdharNumber") {
          const cleanAdhar = String(val).replace(/[\s-]/g, "");
          if (!/^\d{12}$/.test(cleanAdhar)) {
            newErrors[f.key] = "Aadhaar number must consist of exactly 12 digits.";
          }
        }

        // PAN Number: 5 uppercase letters, 4 digits, 1 uppercase letter
        if (f.key === "PanNumber") {
          const cleanPan = String(val).trim();
          if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanPan)) {
            newErrors[f.key] = "PAN must have first 5 uppercase alphabets, next 4 characters as numbers, and last character as an uppercase alphabet (e.g., ABCDE1234F).";
          }
        }

        // Account Number: numbers only, > 10 digits
        if (f.key === "AccountNumber") {
          const cleanAccount = String(val).trim().replace(/[\s-]/g, "");
          if (!/^\d+$/.test(cleanAccount)) {
            newErrors[f.key] = "Account number must consist of numbers only.";
          } else if (cleanAccount.length <= 10) {
            newErrors[f.key] = "Account number must be greater than 10 digits.";
          }
        }

        // IFSC code: first 4 uppercase letters, 5th character a digit, last 6 alphanumeric
        if (f.key === "IFSC") {
          const cleanIFSC = String(val).trim();
          if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/i.test(cleanIFSC)) {
            newErrors[f.key] = "IFSC code must have first 4 uppercase characters, fifth character as a digit, and last 6 as numbers, alphabets, or both (e.g., SBIN0001234).";
          } else if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/.test(cleanIFSC)) {
            newErrors[f.key] = "IFSC alphabets must be in uppercase.";
          }
        }

        // Mobile Numbers: 10-digit Indian number starting with 6, 7, 8, or 9
        if (f.key.toLowerCase().includes("mobilenumber")) {
          const rawMobile = String(val).trim();
          let targetMobile = rawMobile.replace(/[\s\-\(\)\+]/g, "");
          if (targetMobile.startsWith("91") && targetMobile.length > 10) {
            targetMobile = targetMobile.slice(2);
          }
          if (!/^[6-9]\d{9}$/.test(targetMobile)) {
            newErrors[f.key] = "Mobile number should be a 10-digit Indian number starting with 6, 7, 8, or 9.";
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setGeneralError("");
    const success = await onSave(processedData);
    if (success) {
      onClose();
    } else {
      setGeneralError("An error occurred while saving the record. Please check your setup.");
    }
  };

  const getCategoryThemeColors = (id: string) => {
    switch (id) {
      case "personal": return "indigo-500 hover:shadow-indigo-500/25";
      case "financial": return "emerald-500 hover:shadow-emerald-500/25";
      case "card": return "cyan-500 hover:shadow-cyan-500/25";
      case "media": return "amber-500 hover:shadow-amber-500/25";
      default: return "rose-500 hover:shadow-rose-500/25";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="form-modal-backdrop">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="relative transform overflow-hidden rounded-3xl bg-slate-950 border border-white/10 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          id="form-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div>
              <h3 className="text-lg font-black text-white">
                {initialData ? "Edit Record" : `Add New ${category.title}`}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Saved directly to Google Sheets category "{category.sheetName}"
              </p>
            </div>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-slate-950 px-6 py-6 max-h-[60vh] overflow-y-auto space-y-5">
              {generalError && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-300 border border-rose-500/20 shadow-lg animate-pulse">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <span>{generalError}</span>
                </div>
              )}

              {category.fields.map(field => {
                const hasError = !!errors[field.key];
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-black text-slate-350 tracking-wider block">
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        id={`input-${field.key}`}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm bg-slate-900 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                          hasError 
                            ? "border-rose-500 ring-rose-500/20" 
                            : "focus:border-indigo-400"
                        }`}
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`input-${field.key}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        onBlur={(e) => handleBlur(field.key, e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm bg-white/5 border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                          hasError 
                            ? "border-rose-500 ring-2 ring-rose-500/20" 
                            : "focus:border-indigo-500"
                        }`}
                      />
                    )}

                    {hasError && (
                      <p className="text-xs text-rose-400 font-bold ml-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="bg-white/5 px-6 py-5 flex items-center justify-end gap-3.5 border-t border-white/10">
              <button
                id="btn-cancel"
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit"
                type="submit"
                disabled={isSaving}
                className={`group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/10 flex items-center justify-center gap-2 px-6 py-3 text-white font-black text-xs tracking-wider`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600`} />
                <span className="relative flex items-center gap-1.5">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      SAVE RECORD
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
