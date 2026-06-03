import React, { useState } from "react";
import { 
  Copy, Check, Eye, EyeOff, Edit2, Trash2, 
  User, CreditCard, Landmark, Mail, Lock, FileText, Phone, Key, Calendar
} from "lucide-react";
import { CategorySchema } from "../types";

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

  // Let's render custom layout per category
  if (category.id === "personal") {
    const avatarUrl = record.Photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
    
    return (
      <div 
        id={`record-personal-${rowNum}`}
        className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-50">
            <img 
              src={avatarUrl} 
              alt={record.Name} 
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover bg-neutral-100 ring-2 ring-indigo-50 shrink-0"
              onError={(e) => {
                // If provided photo fails to load, replace with generator
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-neutral-800 truncate" title={record.Name}>
                {record.Name || "No Name Given"}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span>DOB: {record.DOB ? record.DOB : "Not set"}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Block */}
          <div className="mt-4 space-y-3.5">
            {/* Identity Papers */}
            {record.AdharNumber && (
              <div className="flex items-center justify-between text-xs bg-neutral-50/55 rounded-lg p-2 border border-neutral-100">
                <span className="text-neutral-500 font-medium">Aadhaar:</span>
                <span className="font-mono text-neutral-800 flex items-center gap-1.5">
                  {record.AdharNumber}
                  <button 
                    onClick={() => triggerCopy(record.AdharNumber, "adhar")}
                    className="p-1 hover:bg-neutral-200 rounded transition text-neutral-400 hover:text-neutral-700"
                  >
                    {copiedKey === "adhar" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
            )}

            {record.PanNumber && (
              <div className="flex items-center justify-between text-xs bg-neutral-50/55 rounded-lg p-2 border border-neutral-100">
                <span className="text-neutral-500 font-medium">PAN:</span>
                <span className="font-mono text-neutral-850 flex items-center gap-1.5 uppercase font-semibold">
                  {record.PanNumber}
                  <button 
                    onClick={() => triggerCopy(record.PanNumber, "pan")}
                    className="p-1 hover:bg-neutral-200 rounded transition text-neutral-400 hover:text-neutral-700"
                  >
                    {copiedKey === "pan" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
            )}

            {record.DrivingLicence && (
              <div className="flex items-center justify-between text-xs bg-neutral-50/55 rounded-lg p-2 border border-neutral-100">
                <span className="text-neutral-500 font-medium">DL:</span>
                <span className="font-mono text-neutral-800 flex items-center gap-1.5">
                  {record.DrivingLicence}
                  <button 
                    onClick={() => triggerCopy(record.DrivingLicence, "dl")}
                    className="p-1 hover:bg-neutral-200 rounded transition text-neutral-400 hover:text-neutral-700"
                  >
                    {copiedKey === "dl" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
            )}

            {/* Comm Lines */}
            <div className="grid grid-cols-1 gap-2 text-xs pt-1">
              {record.MobileNumber && (
                <div className="flex items-center justify-between p-1">
                  <span className="text-neutral-400 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-neutral-300" /> Main</span>
                  <span className="text-neutral-750 font-medium flex items-center gap-1.5">
                    {record.MobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.MobileNumber, "mob")}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5"
                    >
                      {copiedKey === "mob" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </span>
                </div>
              )}

              {record.AlternateMobileNumber && (
                <div className="flex items-center justify-between p-1">
                  <span className="text-neutral-400 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-neutral-300" /> Alternate</span>
                  <span className="text-neutral-750 font-medium flex items-center gap-1.5">
                    {record.AlternateMobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.AlternateMobileNumber, "altmob")}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5"
                    >
                      {copiedKey === "altmob" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </span>
                </div>
              )}

              {record.EmailID && (
                <div className="flex items-center justify-between p-1">
                  <span className="text-neutral-400 flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-neutral-300" /> Email</span>
                  <span className="text-neutral-755 truncate font-medium flex items-center gap-1.5 max-w-[150px]">
                    <span className="truncate">{record.EmailID}</span>
                    <button 
                      onClick={() => triggerCopy(record.EmailID, "email")}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5 flex-shrink-0"
                    >
                      {copiedKey === "email" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-50 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium transition cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-750 font-medium transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
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
        className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-neutral-50">
            <div>
              <div className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-emerald-600" />
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  {record.BankName || "Bank Account"}
                </span>
              </div>
              <h4 className="text-sm font-bold text-neutral-800 mt-1">
                {record.AccountHolderName}
              </h4>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              {record.AccountType || "Savings"}
            </span>
          </div>

          {/* Account Numbers and IFSC */}
          <div className="mt-4 space-y-3 text-xs">
            {record.AccountNumber && (
              <div className="p-3 bg-neutral-50/60 rounded-xl border border-neutral-100/80 space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Account Number</div>
                <div className="font-mono text-sm text-neutral-800 flex items-center justify-between">
                  <span>{record.AccountNumber}</span>
                  <button 
                    onClick={() => triggerCopy(record.AccountNumber, "acc_num")}
                    className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded transition"
                  >
                    {copiedKey === "acc_num" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {record.IFSC && (
                <div className="p-2 border border-neutral-100 bg-neutral-50/20 rounded-lg">
                  <div className="text-[9px] uppercase font-semibold text-neutral-400">IFSC Code</div>
                  <div className="font-mono text-xs text-neutral-800 font-bold flex items-center justify-between mt-1">
                    <span className="truncate">{record.IFSC}</span>
                    <button 
                      onClick={() => triggerCopy(record.IFSC, "ifsc")}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5 shrink-0"
                    >
                      {copiedKey === "ifsc" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}

              {record.UserID && (
                <div className="p-2 border border-neutral-100 bg-neutral-50/20 rounded-lg">
                  <div className="text-[9px] uppercase font-semibold text-neutral-400">Net ID</div>
                  <div className="font-mono text-xs text-neutral-850 flex items-center justify-between mt-1">
                    <span className="truncate max-w-[64px]" title={record.UserID}>{record.UserID}</span>
                    <button 
                      onClick={() => triggerCopy(record.UserID, "uid")}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5 shrink-0"
                    >
                      {copiedKey === "uid" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            {record.Password && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50/40 border border-neutral-100">
                <span className="text-neutral-400">Password:</span>
                <span className="font-mono text-neutral-800 flex items-center gap-1.5">
                  <span className="font-semibold">{isPassVisible ? record.Password : "••••••••"}</span>
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-0.5 hover:text-neutral-800 text-neutral-400"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-0.5 hover:text-neutral-800 text-neutral-400"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {/* Other details */}
            {(record.LinkedMobileNumber || record.LinkedEmail) && (
              <div className="pt-2 border-t border-neutral-50 space-y-1 text-neutral-500">
                {record.LinkedMobileNumber && (
                  <div className="flex justify-between">
                    <span>Linked Mobile:</span>
                    <span className="font-medium text-neutral-700">{record.LinkedMobileNumber}</span>
                  </div>
                )}
                {record.LinkedEmail && (
                  <div className="flex justify-between">
                    <span>Linked Email:</span>
                    <span className="font-medium text-neutral-700 truncate max-w-[150px]">{record.LinkedEmail}</span>
                  </div>
                )}
              </div>
            )}

            {record.SecurityAnswers && (
              <div className="text-[10px] text-neutral-400 bg-neutral-50/30 p-2 rounded border border-neutral-100/50 mt-1 italic">
                <span className="font-medium font-sans">Q&A:</span> {record.SecurityAnswers}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-50 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium transition cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-750 font-medium transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "card") {
    const isCVVVisible = revealSecrets["cvv"];
    const isPinVisible = revealSecrets["pin"];

    // Stylize credit card layout dynamically based on Visa vs Mastercard
    let cardGradient = "from-neutral-850 to-neutral-950 text-white";
    if (record.CardType === "Visa") {
      cardGradient = "from-blue-800 to-indigo-950 text-blue-50";
    } else if (record.CardType === "Mastercard") {
      cardGradient = "from-red-800 to-amber-950 text-amber-50";
    } else if (record.CardType === "Amex") {
      cardGradient = "from-teal-800 to-lime-950 text-teal-50";
    }

    return (
      <div 
        id={`record-card-${rowNum}`}
        className="flex flex-col justify-between bg-white border border-neutral-100 rounded-2xl p-4 hover:shadow-md transition duration-200"
      >
        <div>
          {/* Card Plastic Layout */}
          <div className={`rounded-xl bg-gradient-to-br ${cardGradient} p-4 shadow-md relative overflow-hidden transition`}>
            {/* Background vector accents */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/[0.03] rounded-l-full pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {record.IssuedBank || "Global Card"}
                </p>
                <div className="h-4 w-6 bg-yellow-400/25 border border-yellow-400/50 rounded-md mt-1.5 flex items-center justify-center opacity-80">
                  <span className="text-[6px] text-white font-mono leading-none">█</span>
                </div>
              </div>
              <span className="text-sm font-extrabold tracking-tight italic">
                {record.CardType || "Card"}
              </span>
            </div>

            {/* Card Number */}
            <div className="my-5 flex items-center justify-between">
              <span className="font-mono text-base font-semibold tracking-wider">
                {record.CardNumber || "•••• •••• •••• ••••"}
              </span>
              {record.CardNumber && (
                <button
                  type="button"
                  onClick={() => triggerCopy(record.CardNumber, "card_no")}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition"
                >
                  {copiedKey === "card_no" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Card Footer Exp/CVV */}
            <div className="flex items-end justify-between text-xs">
              <div>
                <p className="text-[8px] uppercase tracking-wider opacity-60">Card Holder</p>
                <p className="font-medium tracking-wide uppercase truncate max-w-[150px]">
                  {record.CardHolderName || "CARDHOLDER NAME"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[8px] uppercase tracking-wider opacity-60">Expires</p>
                  <p className="font-mono font-bold">{record.Expiry || "MM/YY"}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider opacity-60">CVV</p>
                  <p className="font-mono font-bold flex items-center gap-1">
                    <span>{isCVVVisible ? record.CVV : "•••"}</span>
                    <button 
                      onClick={() => toggleSecret("cvv")} 
                      className="p-0.5 hover:text-white opacity-80"
                    >
                      {isCVVVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pin codes & detailed specs hidden below card */}
          {record.PIN && (
            <div className="mt-3.5 p-2 bg-neutral-50/50 rounded-lg border border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-neutral-300" />
                ATM / Transaction PIN:
              </span>
              <span className="font-mono font-bold text-neutral-800 flex items-center gap-1.5">
                <span>{isPinVisible ? record.PIN : "••••"}</span>
                <button 
                  onClick={() => toggleSecret("pin")} 
                  className="p-0.5 hover:text-neutral-750 text-neutral-400"
                >
                  {isPinVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
                <button 
                  onClick={() => triggerCopy(record.PIN, "pin")}
                  className="p-0.5 hover:text-neutral-750 text-neutral-400"
                >
                  {copiedKey === "pin" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-50 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium transition cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-750 font-medium transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
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
      className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-rose-50/10 border-neutral-100">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-${category.color}-50 text-${category.color}-650`}>
              {category.id === "media" ? <Mail className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 truncate" title={record.Particulars}>
              {record.Particulars || "Unlabeled Account"}
            </h4>
          </div>
        </div>

        {/* Credentials body */}
        <div className="mt-4 space-y-3.5 text-xs">
          {/* UserID / Login */}
          {record.Userid && (
            <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-neutral-50/60 border border-neutral-100/50">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Login / ID</span>
              <div className="font-mono text-neutral-800 flex items-center justify-between font-medium mt-0.5">
                <span className="truncate max-w-[180px]">{record.Userid}</span>
                <button 
                  onClick={() => triggerCopy(record.Userid, "uid")}
                  className="p-1 hover:bg-neutral-200 rounded transition text-neutral-400 hover:text-neutral-700"
                >
                  {copiedKey === "uid" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          {record.Password && (
            <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-neutral-50/60 border border-neutral-100/50">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Secure Password</span>
              <div className="font-mono text-neutral-800 flex items-center justify-between font-semibold mt-0.5">
                <span>{isPassVisible ? record.Password : "••••••••"}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-700 transition"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-emerald-600 transition"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recovery mobile details */}
          {record.MobileNumber && (
            <div className="flex items-center justify-between p-1.5 text-neutral-500 text-xs">
              <span className="flex items-center gap-1 text-neutral-400">
                <Phone className="h-3.5 w-3.5" /> Recovery Mobile:
              </span>
              <span className="font-mono text-neutral-700 font-semibold">{record.MobileNumber}</span>
            </div>
          )}

          {/* Others special notes/remarks */}
          {category.id === "others" && record.Remarks && (
            <div className="p-2.5 bg-rose-50/20 border border-neutral-150/50 rounded-lg text-xs italic text-neutral-500">
              {record.Remarks}
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-50 text-xs text-neutral-700">
        <button
          onClick={() => onEdit(record)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-50 hover:bg-neutral-100 text-neutral-750 font-medium transition cursor-pointer"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => onDelete(rowNum)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-750 font-medium transition cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
