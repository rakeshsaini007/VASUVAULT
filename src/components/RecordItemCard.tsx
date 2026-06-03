import React, { useState } from "react";
import { 
  Copy, Check, Eye, EyeOff, Edit2, Trash2, 
  User, CreditCard, Landmark, Mail, Lock, FileText, Phone, Calendar
} from "lucide-react";
import { CategorySchema, formatExpiryToMMYY, formatCardNumber } from "../types";

interface RecordItemCardProps {
  key?: any;
  category: CategorySchema;
  record: Record<string, any>;
  onEdit: (record: Record<string, any>) => void;
  onDelete: (rowNum: number) => any;
}

export default function RecordItemCard({
  category,
  record,
  onEdit,
  onDelete
}: RecordItemCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealSecrets, setRevealSecrets] = useState<Record<string, boolean>>({});

  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleSecret = (key: string) => {
    setRevealSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const rowNum = record._rowNum || 0;

  // Render visual color stripe based on category ID
  const getCategoryStripeClass = (catId: string) => {
    switch (catId) {
      case "personal": return "from-blue-400 to-indigo-600";
      case "financial": return "from-emerald-400 to-teal-600";
      case "card": return "from-cyan-400 to-blue-500";
      case "media": return "from-amber-400 to-orange-600";
      default: return "from-rose-400 to-pink-600";
    }
  };

  // Render custom layout per category
  if (category.id === "personal") {
    const avatarUrl = record.Photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
    
    return (
      <div 
        id={`record-personal-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe from Custom Spec */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Header */}
          <div className="flex items-center gap-4.5 pb-4 border-b border-white/5">
            <img 
              src={avatarUrl} 
              alt={record.Name} 
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover bg-white/15 ring-2 ring-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-black text-white truncate" title={record.Name}>
                {record.Name || "No Name Given"}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>DOB: {record.DOB ? record.DOB : "Not set"}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Block */}
          <div className="mt-5 space-y-3.5">
            {/* Identity Papers */}
            {record.AdharNumber && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">Aadhaar:</span>
                <span className="font-mono text-white flex items-center gap-2">
                  {record.AdharNumber}
                  <button 
                    onClick={() => triggerCopy(record.AdharNumber, "adhar")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "adhar" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.PanNumber && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">PAN:</span>
                <span className="font-mono text-white flex items-center gap-2 uppercase font-black">
                  {record.PanNumber}
                  <button 
                    onClick={() => triggerCopy(record.PanNumber, "pan")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "pan" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.DrivingLicence && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">DL:</span>
                <span className="font-mono text-white flex items-center gap-2">
                  {record.DrivingLicence}
                  <button 
                    onClick={() => triggerCopy(record.DrivingLicence, "dl")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "dl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {/* Comm Lines */}
            <div className="grid grid-cols-1 gap-2.5 pt-2 text-xs">
              {record.MobileNumber && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-500" /> Main</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    {record.MobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.MobileNumber, "mob")}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {copiedKey === "mob" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}

              {record.AlternateMobileNumber && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-500" /> Alternate</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    {record.AlternateMobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.AlternateMobileNumber, "altmob")}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {copiedKey === "altmob" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}

              {record.EmailID && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-500" /> Email</span>
                  <span className="text-white truncate font-bold flex items-center gap-2 max-w-[150px]">
                    <span className="truncate">{record.EmailID}</span>
                    <button 
                      onClick={() => triggerCopy(record.EmailID, "email")}
                      className="text-slate-400 hover:text-white p-0.5 flex-shrink-0"
                    >
                      {copiedKey === "email" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "financial") {
    const isPassVisible = revealSecrets["pwd"];
    return (
      <div 
        id={`record-financial-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-emerald-400" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                  {record.BankName || "Bank Account"}
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-1.5">
                {record.AccountHolderName}
              </h4>
            </div>
            {/* Custom Pill Badge format */}
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
              {record.AccountType || "Savings"}
            </span>
          </div>

          {/* Account Numbers and IFSC */}
          <div className="mt-5 space-y-3.5 text-xs">
            {record.AccountNumber && (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5 hover:bg-white/10 transition">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Account Number</div>
                <div className="font-mono text-sm text-white font-black flex items-center justify-between">
                  <span>{record.AccountNumber}</span>
                  <button 
                    onClick={() => triggerCopy(record.AccountNumber, "acc_num")}
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    {copiedKey === "acc_num" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              {record.IFSC && (
                <div className="p-3 border border-white/5 bg-white/5 rounded-2xl">
                  <div className="text-[9px] uppercase font-black text-slate-400">IFSC Code</div>
                  <div className="font-mono text-xs text-white font-black flex items-center justify-between mt-1.5">
                    <span className="truncate">{record.IFSC}</span>
                    <button 
                      onClick={() => triggerCopy(record.IFSC, "ifsc")}
                      className="text-slate-400 hover:text-white p-0.5 shrink-0"
                    >
                      {copiedKey === "ifsc" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {record.UserID && (
                <div className="p-3 border border-white/5 bg-white/5 rounded-2xl">
                  <div className="text-[9px] uppercase font-black text-slate-400">Net ID</div>
                  <div className="font-mono text-xs text-white font-black flex items-center justify-between mt-1.5">
                    <span className="truncate max-w-[64px]" title={record.UserID}>{record.UserID}</span>
                    <button 
                      onClick={() => triggerCopy(record.UserID, "uid")}
                      className="text-slate-400 hover:text-white p-0.5 shrink-0"
                    >
                      {copiedKey === "uid" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            {record.Password && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 font-bold">Password:</span>
                <span className="font-mono text-white flex items-center gap-1.5">
                  <span className="font-black">{isPassVisible ? record.Password : "••••••••"}</span>
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {/* Other details */}
            {(record.LinkedMobileNumber || record.LinkedEmail) && (
              <div className="pt-2.5 border-t border-white/5 space-y-1 text-slate-400 hover:text-slate-350 transition">
                {record.LinkedMobileNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">Linked Mobile:</span>
                    <span className="font-bold text-white">{record.LinkedMobileNumber}</span>
                  </div>
                )}
                {record.LinkedEmail && (
                  <div className="flex justify-between">
                    <span className="font-medium">Linked Email:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">{record.LinkedEmail}</span>
                  </div>
                )}
              </div>
            )}

            {record.SecurityAnswers && (
              <div className="text-[10px] text-slate-400 bg-white/5 p-3 rounded-2xl border border-white/5 mt-1.5 italic leading-relaxed">
                <span className="font-bold font-sans text-slate-300">Q&A:</span> {record.SecurityAnswers}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "card") {
    const isCVVVisible = revealSecrets["cvv"];
    const isPinVisible = revealSecrets["pin"];

    // Stylize credit card layout dynamically with stunning dark gradients
    let cardGradient = "from-slate-800 to-slate-950 text-white border-white/15 shadow-indigo-505/20";
    if (record.CardType === "Visa") {
      cardGradient = "from-blue-700 via-indigo-900 to-slate-950 text-blue-50 border-blue-500/20 shadow-blue-500/20";
    } else if (record.CardType === "Mastercard") {
      cardGradient = "from-rose-700 via-amber-900 to-slate-950 text-amber-50 border-rose-500/20 shadow-rose-500/20";
    } else if (record.CardType === "Amex") {
      cardGradient = "from-teal-600 via-emerald-900 to-slate-950 text-teal-50 border-teal-500/20 shadow-teal-500/20";
    }

    return (
      <div 
        id={`record-card-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Card Plastic Layout */}
          <div className={`rounded-2xl bg-gradient-to-br ${cardGradient} p-5 border shadow-xl relative overflow-hidden transition duration-300 hover:scale-[1.02]`}>
            {/* Background vector accents */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/[0.04] rounded-l-full pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80">
                  {record.IssuedBank || "Global Card"}
                </p>
                <div className="h-5 w-7 bg-yellow-400/20 border border-yellow-400/40 rounded-lg mt-2 flex items-center justify-center opacity-95">
                  <span className="text-[7px] text-yellow-300 font-mono leading-none">█</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-sm font-black tracking-widest italic py-0.5 px-3 rounded-full bg-white/10">
                  {record.CardType || "Card"}
                </span>
                {record["Debit/Credit"] && (
                  <span className="text-[9px] font-black tracking-widest uppercase py-0.5 px-2.5 rounded-md bg-white/15 border border-white/5 text-white/90">
                    {record["Debit/Credit"]}
                  </span>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div className="my-6 flex items-center justify-between">
              <span className="font-mono text-base font-black tracking-widest text-white">
                {formatCardNumber(record.CardNumber) || "••••-••••-••••-••••"}
              </span>
              {record.CardNumber && (
                <button
                  type="button"
                  onClick={() => triggerCopy(formatCardNumber(record.CardNumber), "card_no")}
                  className="p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                >
                  {copiedKey === "card_no" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Card Footer Exp/CVV */}
            <div className="flex items-end justify-between text-xs pt-1">
              <div>
                <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Card Holder</p>
                <p className="font-black tracking-wide uppercase truncate max-w-[150px] mt-0.5">
                  {record.CardHolderName || "CARDHOLDER NAME"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Expires</p>
                  <p className="font-mono font-black mt-0.5">{formatExpiryToMMYY(record.Expiry)}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase font-black tracking-widest opacity-60">CVV</p>
                  <p className="font-mono font-black flex items-center gap-1.5 mt-0.5">
                    <span>{isCVVVisible ? record.CVV : "•••"}</span>
                    <button 
                      onClick={() => toggleSecret("cvv")} 
                      className="p-0.5 text-white/70 hover:text-white"
                    >
                      {isCVVVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pin codes details hidden below card */}
          {record.PIN && (
            <div className="mt-4 p-3.5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                ATM / Transaction PIN:
              </span>
              <span className="font-mono font-bold text-white flex items-center gap-2">
                <span>{isPinVisible ? record.PIN : "••••"}</span>
                <button 
                  onClick={() => toggleSecret("pin")} 
                  className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                >
                  {isPinVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button 
                  onClick={() => triggerCopy(record.PIN, "pin")}
                  className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                >
                  {copiedKey === "pin" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Handle generic Media/Gmail or Others log credentials Layout
  const isPassVisible = revealSecrets["pwd"];
  return (
    <div 
      id={`record-general-${rowNum}`}
      className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
    >
      {/* Visual Stripe */}
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

      <div>
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/90">
              {category.id === "media" ? <Mail className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
            </div>
            <h4 className="text-base font-black text-white truncate max-w-[180px]" title={record.Particulars}>
              {record.Particulars || "Unlabeled Account"}
            </h4>
          </div>
        </div>

        {/* Credentials body */}
        <div className="mt-5 space-y-4 text-xs">
          {/* UserID / Login */}
          {record.Userid && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login / ID</span>
              <div className="font-mono text-white flex items-center justify-between font-black mt-0.5">
                <span className="truncate max-w-[180px]">{record.Userid}</span>
                <button 
                  onClick={() => triggerCopy(record.Userid, "uid")}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white"
                >
                  {copiedKey === "uid" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          {record.Password && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Password</span>
              <div className="font-mono text-white flex items-center justify-between font-black mt-0.5">
                <span>{isPassVisible ? record.Password : "••••••••"}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-emerald-400 transition"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recovery mobile details */}
          {record.MobileNumber && (
            <div className="flex items-center justify-between p-1.5 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Phone className="h-4 w-4" /> Recovery Mobile:
              </span>
              <span className="font-mono text-white font-black">{record.MobileNumber}</span>
            </div>
          )}

          {/* Others special notes/remarks */}
          {category.id === "others" && record.Remarks && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/10 rounded-2xl text-xs italic text-rose-300 leading-relaxed">
              {record.Remarks}
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs text-slate-300">
        <button
          onClick={() => onEdit(record)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
        >
          <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
          Edit
        </button>
        <button
          onClick={() => onDelete(rowNum)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
