import React, { useState, useEffect } from "react";
import { 
  User, Briefcase, CreditCard, Mail, Lock, 
  Plus, Search, ArrowLeft, Database, Sparkles, 
  HelpCircle, CheckCircle2, AlertCircle, RefreshCw,
  FileSpreadsheet, ExternalLink, Settings, X, ShieldCheck
} from "lucide-react";
import { CATEGORIES, CategorySchema } from "./types";
import { 
  fetchAllData, addRecord, updateRecord, deleteRecord, 
  getActiveScriptUrl, setActiveScriptUrl, resetSimulatedStorage 
} from "./services/dataService";
import RecordItemCard from "./components/RecordItemCard";
import CardFormModal from "./components/CardFormModal";
import { isValidAppsScriptUrl } from "./config";

// Icon components mapping based on string identifiers
const IconMap: Record<string, React.ComponentType<any>> = {
  User: User,
  Briefcase: Briefcase,
  CreditCard: CreditCard,
  Mail: Mail,
  Lock: Lock
};

export default function App() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  
  // Navigation states
  const [selectedCategory, setSelectedCategory] = useState<CategorySchema | null>(null);
  
  // Searching & Filtering states
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sheet edit/add form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeEditingRecord, setActiveEditingRecord] = useState<Record<string, any> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Settings & deployment panel states
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [copiedCodeCode, setCopiedCodeCode] = useState<boolean>(false);

  const handleCopyCodeJs = async () => {
    try {
      const resp = await fetch("/code.js");
      if (!resp.ok) {
        throw new Error("Failed to fetch code.js");
      }
      const rawText = await resp.text();
      await navigator.clipboard.writeText(rawText);
      setCopiedCodeCode(true);
      setTimeout(() => setCopiedCodeCode(false), 3000);
    } catch (err) {
      const fallbackCode = `// Fetching code.js failed. Please open code.js directly in the workspace editor and copy it!`;
      await navigator.clipboard.writeText(fallbackCode);
      setCopiedCodeCode(true);
      setTimeout(() => setCopiedCodeCode(false), 3000);
    }
  };

  // Load all data from API/Simulation
  const loadWorkspaceData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await fetchAllData();
      setData(result.data);
      setIsLive(result.isLive);
      if (result.error) {
        // Soft error notice (shows connection failures but doesn't crash the app)
        setErrorMsg(result.error);
      }
    } catch (err: any) {
      setErrorMsg("An unexpected failure occurred while syncing data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
    setInputUrl(getActiveScriptUrl());
  }, []);

  // Save/Update helper
  const handleSaveRecord = async (formData: Record<string, any>): Promise<boolean> => {
    if (!selectedCategory) return false;
    setIsSaving(true);
    try {
      let result;
      if (activeEditingRecord?._rowNum) {
        // Edit mode
        result = await updateRecord(
          selectedCategory.sheetName,
          activeEditingRecord._rowNum,
          formData
        );
      } else {
        // Add mode
        result = await addRecord(selectedCategory.sheetName, formData);
      }

      if (result.success) {
        showSuccessAlert(result.message);
        await loadWorkspaceData(false); // reload lists without blocking spinner
        return true;
      } else {
        setErrorMsg(result.message);
        return false;
      }
    } catch (e: any) {
      setErrorMsg("Failed to deliver submission: " + e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete helper
  const handleDeleteRecord = async (rowNum: number) => {
    if (!selectedCategory) return;
    
    const confirmText = selectedCategory.id === "card" 
      ? "Are you sure you want to permanently delete this card record?" 
      : "Are you sure you want to permanently delete this record?";
      
    if (!window.confirm(confirmText)) return;

    try {
      setIsLoading(true);
      const result = await deleteRecord(selectedCategory.sheetName, rowNum);
      if (result.success) {
        showSuccessAlert(result.message);
        await loadWorkspaceData(false);
      } else {
        setErrorMsg(result.message);
      }
    } catch (e: any) {
      setErrorMsg("Delete request failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger form for Addition
  const handleOpenAddForm = () => {
    setActiveEditingRecord(null);
    setIsModalOpen(true);
  };

  // Trigger form for Editing
  const handleOpenEditForm = (record: Record<string, any>) => {
    setActiveEditingRecord(record);
    setIsModalOpen(true);
  };

  // Action to update API URL manually from UI
  const handleSaveApiUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const trimmed = inputUrl.trim();
    
    if (trimmed === "") {
      setActiveScriptUrl("");
      showSuccessAlert("URL cleared. Reset back to offline browser simulator.");
      setIsSetupOpen(false);
      await loadWorkspaceData();
    } else if (isValidAppsScriptUrl(trimmed)) {
      setActiveScriptUrl(trimmed);
      showSuccessAlert("New Google Apps Script Web App URL registered successfully!");
      setIsSetupOpen(false);
      await loadWorkspaceData();
    } else {
      setErrorMsg("Please enter a valid Google Apps Script Web App URL. It must begin with https://script.google.com/macros/");
    }
  };

  // Setup simulated sandbox helper
  const handleResetStorage = async () => {
    if (window.confirm("This will erase all your simulated edits and restore the beautiful initial mock data. Proceed?")) {
      resetSimulatedStorage();
      showSuccessAlert("Local database restored to default.");
      await loadWorkspaceData();
    }
  };

  const showSuccessAlert = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg("");
    }, 5000);
  };

  // Filters records of selected sheets based on searchQuery
  const getFilteredRecords = () => {
    if (!selectedCategory) return [];
    const rawList = data[selectedCategory.sheetName] || [];
    if (!searchQuery.trim()) return rawList;

    const query = searchQuery.toLowerCase();
    return rawList.filter(record => {
      return Object.entries(record).some(([key, val]) => {
        if (key.startsWith("_")) return false; // skip internal row numbers
        return String(val || "").toLowerCase().includes(query);
      });
    });
  };

  // Get total rows counts for category cards
  const getRecordCount = (sheetName: string) => {
    return data[sheetName]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans" id="main-vault-root">
      
      {/* 1. TOP HEADER & TELEMETRY CONTROL */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/60 sticky top-0 z-40" id="global-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5.5 w-5.5 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold tracking-tight text-zinc-900 leading-tight">
                Personal Vault
              </h1>
              <p className="text-[10.5px] text-zinc-400 font-normal mt-0.5">
                Client Dashboard connected to spreadsheet schemas
              </p>
            </div>
          </div>

          {/* Quick Info Alerts / Mode State */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Live Indicator */}
            {isLive ? (
              <div 
                id="live-status-connected"
                onClick={() => setIsSetupOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-200 p-1 cursor-pointer hover:bg-zinc-100 transition duration-150"
                title="Your edits are sending real HTTP POST and GET requests directly to live Google Sheets: Connected"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            ) : (
              <div 
                id="live-status-simulated"
                onClick={() => setIsSetupOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100/80 border border-zinc-200 p-1 cursor-pointer hover:bg-zinc-200/50 transition duration-150"
                title="Currently simulating Google Sheets saving locally: Click to connect. Sandbox Mode"
              >
                <span className="relative flex h-2 w-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
              </div>
            )}

            {/* Quick Setup Trigger */}
            <button
              id="btn-settings-toggle"
              onClick={() => setIsSetupOpen(true)}
              className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:border-zinc-300 transition-all duration-150 cursor-pointer"
              title="Connect Sheets Settings"
            >
              <Settings className="h-3.5 w-3.5 text-zinc-500" />
            </button>
            
            {/* Refresh button */}
            <button
              id="btn-manual-sync"
              onClick={() => loadWorkspaceData()}
              className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:border-zinc-300 transition-all duration-150 cursor-pointer"
              title="Reload data from server"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-zinc-900" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ALERT BANNERS */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-4 space-y-3" id="notification-zone">
        
        {successMsg && (
          <div className="flex items-center gap-3 rounded-lg bg-zinc-900 text-white p-3.5 text-xs shadow-md animate-fadeIn border border-zinc-800">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-4 rounded-xl bg-red-50 border border-red-100 p-4 text-xs shadow-xs animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-red-950 text-[13px] mb-1">Backup Vault Synchronization Interrupted</p>
              <p className="text-red-800 text-[11px] leading-relaxed bg-white/40 border border-red-200/50 rounded-lg p-2.5 font-mono select-text" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{errorMsg}</p>
              {(errorMsg.toLowerCase().includes("redeploy") || errorMsg.toLowerCase().includes("apps script") || errorMsg.toLowerCase().includes("non-200") || errorMsg.toLowerCase().includes("parse") || errorMsg.toLowerCase().includes("failure") || errorMsg.toLowerCase().includes("error")) && (
                <div className="mt-3 bg-red-100/50 rounded-lg p-2.5 border border-red-200/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-red-900 text-[11px]">Deploy Code Action Required</p>
                    <p className="text-red-700/80 text-[10px] mt-0.5">To remove the addHeader CORS error, update your custom Google Sheets Apps Script.</p>
                  </div>
                  <button
                    onClick={handleCopyCodeJs}
                    type="button"
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-transparent rounded-lg transition-all duration-150 shadow-sm cursor-pointer"
                    id="btn-copy-corrected-script"
                  >
                    {copiedCodeCode ? "✓ Copied!" : "📋 Copy Corrected Script"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 mb-12">
        
        {/* Dynamic Inner views based on category selection */}
        {!selectedCategory ? (
          
          /* VIEW A: LANDING CATEGORIES DASHBOARD */
          <div className="space-y-8" id="dashboard-categories-view">

            {/* Grid of the 5 sheets card layouts */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200/40">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-zinc-400" />
                  Your Active Secure Sheets
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium bg-zinc-200/50 px-2 py-0.5 rounded">
                  {CATEGORIES.length} Active Schemas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="categories-grid-container">
                {CATEGORIES.map(category => {
                  const IconComponent = IconMap[category.icon] || Database;
                  const recordCount = getRecordCount(category.sheetName);

                  return (
                    <div
                      key={category.id}
                      id={`category-card-${category.id}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSearchQuery("");
                      }}
                      className="group bg-white border border-zinc-200/80 p-5 rounded-xl cursor-pointer hover:border-zinc-800 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Header card log */}
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-150 text-zinc-800 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-200">
                            <IconComponent className="h-5.5 w-5.5 stroke-[1.5]" />
                          </div>
                          
                          {/* Record counter badge */}
                          <div className="bg-zinc-50 hover:bg-zinc-100 text-zinc-650 text-[11px] font-medium px-2 py-0.5 rounded border border-zinc-200/60 transition flex items-center gap-1.5">
                            <span className="font-mono text-zinc-900 font-bold">{recordCount}</span>
                            <span className="text-[9px] text-zinc-400 uppercase tracking-widest">records</span>
                          </div>
                        </div>

                        {/* Title text */}
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-950 transition">
                            {category.title}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 lines-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      {/* Card meta tags footer */}
                      <div className="pt-3 mt-5 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-zinc-405 group-hover:text-zinc-800 transition">
                        <span className="font-mono text-[9px] uppercase text-zinc-400">Sheet: {category.sheetName}</span>
                        <span className="text-[11px] text-zinc-500 group-hover:translate-x-0.5 transition-transform duration-150">
                          Edit Records →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        ) : (
          
          /* VIEW B: DIRECT DETAILED SHEETS RECORDS (CARDS LAYOUT) */
          <div className="space-y-6" id="sheet-detail-records-view">
            
            {/* Nav Header breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
              
              <div className="flex items-center gap-3">
                <button
                  id="btn-back-breadcrumb"
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 text-zinc-500 transition cursor-pointer"
                  title="Back to Sheets Selector"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
                      Sheet: {selectedCategory.sheetName}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-350" />
                    <span className="text-[9px] font-bold uppercase py-0.5 px-1.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-150/40">
                      {isLive ? "Live Sync Active" : "Local Simulator"}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 mt-0.5 flex items-center gap-2">
                    {selectedCategory.title}
                  </h2>
                </div>
              </div>

              {/* Central Action triggers */}
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  id="btn-add-record-top"
                  onClick={handleOpenAddForm}
                  className="bg-zinc-900 text-white rounded-lg px-4.5 py-2 text-xs font-semibold hover:bg-zinc-800 transition shadow-sm flex items-center gap-1.5 cursor-pointer border border-zinc-900"
                >
                  <Plus className="h-4 w-4" />
                  Add New Record
                </button>
              </div>
            </div>

            {/* Searching Filters and Stats bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-xl">
              <div className="relative w-full md:w-96 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="search-records-input"
                  type="text"
                  placeholder={`Search details in this category...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50/50 outline-none border border-zinc-250/60 focus:border-zinc-900 focus:bg-white rounded-lg transition duration-150"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-zinc-400 hover:text-zinc-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-3.5">
                <span>Total Stored: <b className="text-zinc-800">{getRecordCount(selectedCategory.sheetName)} rows</b></span>
                {searchQuery && (
                  <>
                    <span className="h-3 w-px bg-zinc-250" />
                    <span>Search Matches: <b className="text-zinc-950">{getFilteredRecords().length}</b></span>
                  </>
                )}
              </div>
            </div>

            {/* List Loader spinner */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4" id="loading-spinner-box">
                <div className="relative flex h-8 w-8">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-205 opacity-75"></div>
                  <div className="relative inline-flex rounded-full h-8 w-8 bg-zinc-900 items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400">Querying Sheet Rows from Database...</p>
              </div>
            ) : (
              
              /* Main lists layout */
              <div className="space-y-6">
                {getFilteredRecords().length === 0 ? (
                  
                  /* Empty state card helper */
                  <div className="border border-dashed border-zinc-200 bg-white rounded-xl py-14 px-4 text-center max-w-md mx-auto" id="no-records-card">
                    <div className="h-10 w-10 bg-zinc-50 text-zinc-400 rounded-lg flex items-center justify-center mx-auto mb-3.5 border border-zinc-150">
                      <Search className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-800">
                      {searchQuery ? "No matches found" : `Empty Sheet`}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 md:mt-1.5 leading-relaxed">
                      {searchQuery ? "Check keywords or clear spelling parameters." : "Initiate your live Google Sheet database by adding your first row."}
                    </p>
                    <div className="mt-4">
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-[11px] bg-zinc-50 border border-zinc-150 text-zinc-700 hover:bg-zinc-100 px-3 py-1.5 rounded font-semibold transition"
                        >
                          Clear Query
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenAddForm}
                          className="bg-zinc-900 text-white hover:bg-zinc-850 text-[11px] font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add First Record Row
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  
                  /* RENDER RESPONSIVE CARDS GRID */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="records-grid-container">
                    
                    {/* Dynamic List */}
                    {getFilteredRecords().map((record) => (
                      <RecordItemCard
                        key={record._rowNum || Math.random()}
                        category={selectedCategory}
                        record={record}
                        onEdit={handleOpenEditForm}
                        onDelete={handleDeleteRecord}
                      />
                    ))}

                    {/* Interactive "Append placeholder block" inside grid */}
                    <div 
                      onClick={handleOpenAddForm}
                      className="border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] bg-white hover:bg-zinc-50/50 transition-all duration-150 group"
                      id="card-append-placeholder"
                    >
                      <div className="p-2 bg-zinc-50 rounded-full text-zinc-400 group-hover:scale-105 transition border border-zinc-150">
                        <Plus className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-[10.5px] font-bold text-zinc-400 mt-3 font-sans uppercase tracking-wider group-hover:text-zinc-600 transition">
                        Add entry to {selectedCategory.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 max-w-[170px] mt-1 leading-relaxed">
                        Appends a new record row into the target spreadsheet.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. SLIDE-OUT PANEL FOR GOOGLE CONFIG APPS SCRIPT GUIDE */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="setup-drawer">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] transition-opacity" 
            onClick={() => setIsSetupOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-zinc-205 flex flex-col justify-between shadow-xl animate-slideOver">
              
              {/* Drawer Scroll body */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                
                {/* Drawer Header */}
                <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Database className="h-4.5 w-4.5 text-zinc-800" />
                      Google Sheets Integration
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                      Connect your spreadsheet to enjoy real persistent edits.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsSetupOpen(false)}
                    className="p-1 rounded-md border border-zinc-100 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-55 transition-all duration-150 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* API Input Form */}
                <form onSubmit={handleSaveApiUrl} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Google Apps Script Web-App URL
                    </label>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Enter the deployed Google Apps Script URL. Leave blank to run in Browser Simulator sandbox.
                    </p>
                    <div className="mt-2 text-[10px] font-semibold text-zinc-700 bg-zinc-50 p-2 rounded border border-zinc-150/80">
                      💡 Active Mode: <span className="text-zinc-900">{isLive ? "Live Sync Server" : "Browser Simulation"}</span>
                    </div>
                    <textarea
                      id="input-setup-api-url"
                      rows={3}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full text-xs font-mono border border-zinc-200 focus:border-zinc-900 focus:ring-0 rounded-lg p-2.5 outline-none bg-zinc-50/50 focus:bg-white transition"
                    />
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      id="btn-save-setup-url"
                      type="submit"
                      className="flex-1 rounded-lg bg-zinc-900 text-white py-2 px-3 hover:bg-zinc-850 transition font-semibold cursor-pointer border border-zinc-900 text-xs"
                    >
                      Authenticate URL
                    </button>
                    {getActiveScriptUrl() && (
                      <button
                        id="btn-clear-setup"
                        type="button"
                        onClick={() => {
                          setInputUrl("");
                          setActiveScriptUrl("");
                          showSuccessAlert("URL cleared from local configurations.");
                          setIsSetupOpen(false);
                          loadWorkspaceData();
                        }}
                        className="rounded-lg border border-zinc-200 text-zinc-650 hover:bg-zinc-50 px-3 cursor-pointer transition font-medium"
                      >
                        Reset Local
                      </button>
                    )}
                  </div>
                </form>

                {/* Deployment Guide Bullet Points */}
                <div className="space-y-4 pt-4.5 border-t border-zinc-100">
                  <h4 className="text-[10px] font-bold text-zinc-405 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                    Simple Deployment Guide
                  </h4>

                  <ol className="space-y-3 test-xs text-zinc-500 text-[11px] leading-relaxed">
                    <li className="space-y-0.5">
                      <div className="font-semibold text-zinc-800">1. Prepare your Spreadsheet</div>
                      <p className="text-[10.5px] text-zinc-400">
                        Create a blank Google Spreadsheet in your account.
                      </p>
                    </li>
                    <li className="space-y-0.5">
                      <div className="font-semibold text-zinc-800">2. Open Apps Script Editor</div>
                      <p className="text-[10.5px] text-zinc-400">
                        Select <b>Extensions &gt; Apps Script</b> in your spreadsheet tab.
                      </p>
                    </li>
                    <li className="space-y-0.5">
                      <div className="font-semibold text-zinc-800">3. Copy and Paste backend program</div>
                      <p className="text-[10.5px] text-zinc-400">
                        Copy the entire contents of `code.js` from this project workspace, paste it into Google Apps Script file, and save.
                      </p>
                    </li>
                    <li className="space-y-0.5">
                      <div className="font-semibold text-zinc-800">4. Publish Web App</div>
                      <p className="text-[10.5px] text-zinc-400">
                        Deploy is top-right. Set "Execute as" to <b>Me</b>, and "Who has access" to <b className="text-zinc-800 font-bold">Anyone</b> (CORS validation).
                      </p>
                    </li>
                    <li className="space-y-0.5">
                      <div className="font-semibold text-zinc-800">5. Authorize</div>
                      <p className="text-[10.5px] text-zinc-400">
                        Allow security permissions and copy the deployed URL. Paste above!
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-2 pt-4 border-t border-zinc-100">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Dynamic Creation
                  </h4>
                  <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                    Our Apps Script dynamically formats all tabs: <code className="bg-zinc-50 text-zinc-800 px-1 py-0.5 tracking-tight font-mono text-[9px] border rounded">PersonalData</code>, <code className="bg-zinc-50 text-zinc-800 px-1 py-0.5 tracking-tight font-mono text-[9px] border rounded">FinancialData</code>, etc. You don't have to prepare anything yourself!
                  </p>
                </div>

              </div>

              {/* Drawer Footer actions */}
              <div className="bg-zinc-50 border-t border-zinc-100 px-5 py-3 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium font-sans">Setup Instructions</span>
                <button
                  onClick={() => setIsSetupOpen(false)}
                  className="bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold py-1 px-3 rounded-md cursor-pointer transition text-xs"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN MODIFIED DIALOG / FORM */}
      {selectedCategory && (
        <CardFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={selectedCategory}
          initialData={activeEditingRecord}
          onSave={handleSaveRecord}
          isSaving={isSaving}
        />
      )}


    </div>
  );
}
