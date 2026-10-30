import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { LangContext } from "../App";
import Swal from "sweetalert2";
import "./Wallet.css";

export default function MedicalWallet() {
  const { lang } = useContext(LangContext);

  const t = {
    en: {
      badge: "Encrypted Health Locker",
      title: "Digital Medical Wallet",
      subtitle: "Securely organize your prescriptions, lab reports, doctor notes, and x-rays in one place.",
      searchPlaceholder: "🔍 Search hospital, doctor, test name...",
      addDocBtn: "➕ Add Document",
      closeFormBtn: "✕ Close Form",
      filters: [
        { key: "All", label: "All" },
        { key: "Prescription 💊", label: "Prescription 💊" },
        { key: "Lab Report 🧪", label: "Lab Report 🧪" },
        { key: "Scan / X-Ray 🩻", label: "Scan / X-Ray 🩻" },
        { key: "Vaccine Record 💉", label: "Vaccine Record 💉" },
        { key: "Discharge Summary 📄", label: "Discharge Summary 📄" },
      ],
      addTitle: "📁 Add New Medical Document",
      savedDbBadge: "Saved to Database",
      docNameLabel: "Document / Hospital Name *",
      docNamePlaceholder: "e.g. Apollo Hospital Blood Work, Dr. Sharma Clinic",
      recordTypeLabel: "Record Type",
      notesLabel: "Doctor / Health Notes (Optional)",
      notesPlaceholder: "e.g. Recommended repeat test in 3 months, dosage notes",
      dropzoneTitle: "Click to attach Prescription or Report",
      dropzoneSub: "Supports PNG, JPG, JPEG, and PDF (Up to 10MB)",
      removeFile: "✕ Remove",
      saveBtn: "💾 Save Document to Wallet",
      noRecordsTitle: "No Medical Records Found",
      noRecordsSub: "Your wallet is empty. Click '+ Add Document' to store your prescriptions and reports.",
      noRecordsSearch: "No records matched your search filter.",
      notesPrefix: "Notes:",
      previewBtn: "👁️ View Document",
      deleteConfirmTitle: "Delete Medical Record?",
      deleteConfirmText: "This document will be removed from your wallet.",
      deleteConfirmBtn: "Yes, delete",
      previewModalTitle: "📄 Medical Document Preview",
      downloadBtn: "⬇️ Download Document File",
      closeBtn: "✕ Close",
    },
    hi: {
      badge: "एन्क्रिप्टेड हेल्थ लॉकर",
      title: "डिजिटल मेडिकल वॉलेट",
      subtitle: "अपने नुस्खे, लैब रिपोर्ट, डॉक्टर के नोट्स और एक्स-रे एक ही सुरक्षित स्थान पर रखें।",
      searchPlaceholder: "🔍 अस्पताल, डॉक्टर, रिपोर्ट या दवा का नाम खोजें...",
      addDocBtn: "➕ नया दस्तावेज़ जोड़ें",
      closeFormBtn: "✕ फॉर्म बंद करें",
      filters: [
        { key: "All", label: "सभी दस्तावेज़" },
        { key: "Prescription 💊", label: "नुस्खा (पर्चा) 💊" },
        { key: "Lab Report 🧪", label: "लैब रिपोर्ट 🧪" },
        { key: "Scan / X-Ray 🩻", label: "स्कैन / एक्स-रे 🩻" },
        { key: "Vaccine Record 💉", label: "वैक्सीन रिकॉर्ड 💉" },
        { key: "Discharge Summary 📄", label: "डिस्चार्ज सारांश 📄" },
      ],
      addTitle: "📁 नया मेडिकल दस्तावेज़ जोड़ें",
      savedDbBadge: "डेटाबेस में सुरक्षित",
      docNameLabel: "दस्तावेज़ / अस्पताल या डॉक्टर का नाम *",
      docNamePlaceholder: "जैसे: अपोलो ब्लड टेस्ट, डॉ. शर्मा क्लिनिक",
      recordTypeLabel: "दस्तावेज़ का प्रकार",
      notesLabel: "डॉक्टर की सलाह / नोट्स (वैकल्पिक)",
      notesPlaceholder: "जैसे: 3 महीने बाद दोबारा जांच, दवा का समय",
      dropzoneTitle: "पर्चा या रिपोर्ट फ़ाइल संलग्न करने के लिए क्लिक करें",
      dropzoneSub: "PNG, JPG, JPEG और PDF समर्थित (10MB तक)",
      removeFile: "✕ फ़ाइल हटाएं",
      saveBtn: "💾 मेडिकल वॉलेट में सुरक्षित करें",
      noRecordsTitle: "कोई मेडिकल रिकॉर्ड नहीं मिला",
      noRecordsSub: "आपका वॉलेट अभी खाली है। पर्चे या टेस्ट रिपोर्ट जोड़ने के लिए '+ नया दस्तावेज़ जोड़ें' पर क्लिक करें।",
      noRecordsSearch: "आपकी खोज से मेल खाता कोई रिकॉर्ड नहीं मिला।",
      notesPrefix: "नोट्स:",
      previewBtn: "👁️ दस्तावेज़ देखें",
      deleteConfirmTitle: "दस्तावेज़ हटाएं?",
      deleteConfirmText: "यह रिकॉर्ड आपके वॉलेट से हटा दिया जाएगा।",
      deleteConfirmBtn: "हाँ, हटाएं",
      previewModalTitle: "📄 मेडिकल दस्तावेज़ पूर्वावलोकन",
      downloadBtn: "⬇️ फ़ाइल डाउनलोड करें",
      closeBtn: "✕ बंद करें",
    },
  };

  const str = t[lang] || t.en;

  const user = JSON.parse(localStorage.getItem("lg_user") || "{}");
  const userKey = user?._id || user?.email || "guest";
  const STORAGE_KEY = `lg_medical_records_${userKey}`;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Form states
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("Prescription 💊");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  /* ================= FETCH RECORDS ================= */
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/medical-wallet");
      if (Array.isArray(res.data)) {
        setRecords(res.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn("Medical wallet fetch note, using local cache:", err.message);
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setRecords(cached);
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLE FILE SELECTION ================= */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire("File Too Large", "Please choose a file under 10MB.", "warning");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  /* ================= ADD NEW RECORD ================= */
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!documentName.trim()) {
      Swal.fire("Document Name Required", "Please enter the title or hospital name.", "warning");
      return;
    }

    try {
      const payload = {
        documentName: documentName.trim(),
        documentType,
        notes: notes.trim(),
        fileName: selectedFile ? selectedFile.name : "",
        fileData: fileBase64 || "",
        fileSize: selectedFile ? formatFileSize(selectedFile.size) : "",
      };

      const res = await api.post("/medical-wallet", payload);
      const newSavedDoc = res.data;

      const updated = [newSavedDoc, ...records];
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Reset form
      setDocumentName("");
      setNotes("");
      setSelectedFile(null);
      setFileBase64("");
      setShowAddForm(false);

      Swal.fire("Record Saved!", "Document safely encrypted and stored in your wallet.", "success");
    } catch (err) {
      console.error("Save error:", err);
      // Fallback local addition
      const localRecord = {
        _id: "local_" + Date.now(),
        documentName: documentName.trim(),
        documentType,
        notes: notes.trim(),
        fileName: selectedFile ? selectedFile.name : "",
        fileData: fileBase64 || "",
        fileSize: selectedFile ? formatFileSize(selectedFile.size) : "",
        createdAt: new Date().toISOString(),
      };
      const updated = [localRecord, ...records];
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setShowAddForm(false);
      Swal.fire("Saved", "Record saved to your medical wallet.", "success");
    }
  };

  /* ================= DELETE RECORD ================= */
  const handleDeleteRecord = async (id) => {
    const res = await Swal.fire({
      title: "Delete Medical Record?",
      text: "This document will be removed from your wallet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });

    if (!res.isConfirmed) return;

    try {
      await api.delete(`/medical-wallet/${id}`);
      const updated = records.filter((r) => (r._id || r.id) !== id);
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      Swal.fire("Deleted", "Document removed.", "success");
    } catch (err) {
      const updated = records.filter((r) => (r._id || r.id) !== id);
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  /* ================= FILTERING & SEARCH ================= */
  const filterCategories = str.filters;

  const filteredRecords = records.filter((rec) => {
    const matchCategory =
      selectedFilter === "All" || rec.documentType?.includes(selectedFilter.split(" ")[0]);
    const matchSearch =
      !searchQuery.trim() ||
      rec.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <h1 className="wallet-title">{str.title}</h1>
        <p className="wallet-subtitle">{str.subtitle}</p>
      </div>

      {/* Toolbar */}
      <div className="wallet-toolbar">
        <input
          type="text"
          className="wallet-search-input"
          placeholder={str.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button
          type="button"
          className="wallet-upload-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <span>{showAddForm ? str.closeFormBtn : str.addDocBtn}</span>
        </button>
      </div>

      {/* Filter Category Pills */}
      <div className="wallet-filters">
        {filterCategories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`wallet-filter-pill ${selectedFilter === cat.key ? "active" : ""}`}
            onClick={() => setSelectedFilter(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Upload New Record Form Card */}
      {showAddForm && (
        <div className="wallet-form-card">
          <div className="wallet-form-header">
            <h3 className="wallet-form-title">{str.addTitle}</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{str.savedDbBadge}</span>
          </div>

          <form onSubmit={handleAddRecord}>
            <div className="wallet-form-grid">
              <div className="wallet-form-field">
                <label>{str.docNameLabel}</label>
                <input
                  type="text"
                  className="wallet-form-input"
                  placeholder={str.docNamePlaceholder}
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>

              <div className="wallet-form-field">
                <label>{str.recordTypeLabel}</label>
                <select
                  className="wallet-form-select"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="Prescription 💊">{lang === "hi" ? "नुस्खा (पर्चा) 💊" : "Prescription 💊"}</option>
                  <option value="Lab Report 🧪">{lang === "hi" ? "लैब रिपोर्ट 🧪" : "Lab Report 🧪"}</option>
                  <option value="Scan / X-Ray 🩻">{lang === "hi" ? "स्कैन / एक्स-रे 🩻" : "Scan / X-Ray 🩻"}</option>
                  <option value="Vaccine Record 💉">{lang === "hi" ? "वैक्सीन रिकॉर्ड 💉" : "Vaccine Record 💉"}</option>
                  <option value="Discharge Summary 📄">{lang === "hi" ? "डिस्चार्ज समरी 📄" : "Discharge Summary 📄"}</option>
                  <option value="Other Medical Bill 📋">{lang === "hi" ? "मेडिकल बिल 📋" : "Medical Bill 📋"}</option>
                </select>
              </div>

              <div className="wallet-form-field" style={{ gridColumn: "1 / -1" }}>
                <label>{str.notesLabel}</label>
                <input
                  type="text"
                  className="wallet-form-input"
                  placeholder={str.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* File Dropzone */}
            <label className="wallet-file-dropzone" htmlFor="wallet-file-input">
              <input
                id="wallet-file-input"
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>📎</div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                {str.dropzoneTitle}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                {str.dropzoneSub}
              </div>
            </label>

            {selectedFile && (
              <div className="wallet-file-selected">
                <span>
                  📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedFile(null);
                    setFileBase64("");
                  }}
                >
                  {str.removeFile}
                </button>
              </div>
            )}

            <button type="submit" className="wallet-upload-btn" style={{ width: "100%" }}>
              <span>{str.saveBtn}</span>
            </button>
          </form>
        </div>
      )}

      {/* Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="wallet-empty">
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📁</div>
          <h3 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>{str.noRecordsTitle}</h3>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {searchQuery ? str.noRecordsSearch : str.noRecordsSub}
          </p>
        </div>
      ) : (
        <div className="wallet-records-grid">
          {filteredRecords.map((rec) => {
            const id = rec._id || rec.id;
            return (
              <div className="wallet-record-card" key={id}>
                <div>
                  <div className="wallet-record-top">
                    <div className="wallet-record-icon-badge">
                      {rec.documentType?.includes("💊")
                        ? "💊"
                        : rec.documentType?.includes("🧪")
                        ? "🧪"
                        : rec.documentType?.includes("🩻")
                        ? "🩻"
                        : rec.documentType?.includes("💉")
                        ? "💉"
                        : "📄"}
                    </div>
                    <div className="wallet-record-info">
                      <h4>{rec.documentName}</h4>
                      <span className="wallet-record-type">{rec.documentType}</span>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="wallet-record-notes">
                      <strong>{str.notesPrefix}</strong> {rec.notes}
                    </div>
                  )}

                  <div className="wallet-record-meta">
                    <span>
                      📅 {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "Saved"}
                    </span>
                    {rec.fileName && (
                      <span title={rec.fileName}>
                        📎 {rec.fileSize || "Attached"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="wallet-record-actions">
                  {rec.fileData ? (
                    <button
                      type="button"
                      className="wallet-view-btn"
                      onClick={() => setPreviewModalDoc(rec)}
                    >
                      {str.previewBtn}
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center", flex: 1 }}>
                      No attachment
                    </span>
                  )}

                  <button
                    type="button"
                    className="wallet-delete-btn"
                    onClick={() => handleDeleteRecord(id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewModalDoc && (
        <div className="wallet-modal-overlay" onClick={() => setPreviewModalDoc(null)}>
          <div className="wallet-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>
                  {previewModalDoc.documentName}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {previewModalDoc.fileName || "Medical Document"}
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onClick={() => setPreviewModalDoc(null)}
              >
                ✕
              </button>
            </div>

            <div className="wallet-modal-content">
              {previewModalDoc.fileData?.startsWith("data:image") ? (
                <img
                  src={previewModalDoc.fileData}
                  alt={previewModalDoc.documentName}
                  className="wallet-preview-img"
                />
              ) : (
                <div style={{ padding: "30px 10px" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 10px 0" }}>📄</p>
                  <p style={{ fontWeight: "700" }}>{previewModalDoc.fileName || "PDF Document"}</p>
                  <a
                    href={previewModalDoc.fileData}
                    download={previewModalDoc.fileName || "medical_record.pdf"}
                    className="wallet-upload-btn"
                    style={{ textDecoration: "none", display: "inline-flex", marginTop: "10px" }}
                  >
                    {str.downloadBtn}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
