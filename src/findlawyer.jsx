// src/findlawyer.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  Scale,
  Languages,
  Phone,
  ExternalLink,
} from "lucide-react";
import Navbar from "./Navbar";
import "./findlawyer.css";
import lawyersData from "../src/lawyers.json";

/* ---------- helpers (same intent as your version) ---------- */

const knownCities = [
  "mumbai","bombay","delhi","new delhi","bangalore","bengaluru","chennai","kolkata",
  "pune","noida","gurgaon","gurugram","hyderabad","ahmedabad","kochi","trivandrum",
  "lucknow","patna","jaipur","chandigarh","ludhiana","bhubaneswar",
];

const categories = [
  "Personal/family Lawyer",
  "Criminal/Property Lawyer",
  "Corporate Lawyer",
  "Civil/Debt lawyer",
];

const categoryKeywords = {
  "Personal/family Lawyer": ["family law", "matrimonial", "divorce", "custody"],
  "Criminal/Property Lawyer": ["criminal law", "white collar", "property law", "real estate", "ndps"],
  "Corporate Lawyer": ["corporate", "business law", "mergers", "m&a", "capital markets", "private equity", "venture"],
  "Civil/Debt lawyer": ["civil litigation", "debt", "bankruptcy", "insolvency", "debt recovery", "drt"],
};

const safeString = (v) => (v === undefined || v === null ? "" : String(v));

const parseLanguages = (languagesField) => {
  if (!languagesField) return [];
  if (Array.isArray(languagesField)) {
    return languagesField
      .map((s) => (s || "").split(/\r?\n/))
      .flat()
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (typeof languagesField === "string") {
    return languagesField
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
};

const extractCityFromLocation = (location = "") => {
  const lower = (location || "").toLowerCase();
  if (!lower) return "";
  const tokens = lower.split(/[,()\-]/).map((t) => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    for (const city of knownCities) {
      if (tok.includes(city)) return city;
    }
  }
  for (const city of knownCities) {
    if (lower.includes(city)) return city;
  }
  const last = tokens[tokens.length - 1] || "";
  if (last && !/\d/.test(last) && last.length <= 30) return last;
  return "";
};

const deriveCourtType = (forums = []) => {
  if (!Array.isArray(forums) || forums.length === 0) return "Other";
  const joined = forums.join(" ").toLowerCase();
  if (joined.includes("supreme")) return "Supreme Court";
  if (joined.includes("high court")) return "High Court";
  if (joined.includes("district court") || joined.includes("sessions court") || joined.includes("district & sessions"))
    return "District Court";
  return "Other";
};

const parseExperienceYears = (experienceStr) => {
  if (!experienceStr) return 0;
  if (typeof experienceStr === "number") return experienceStr;
  const m = String(experienceStr).match(/(\d+)\s*(?:\+)?/);
  return m ? parseInt(m[1], 10) : 0;
};

const normalizeLawyer = (raw = {}, idx) => {
  const name = safeString(raw.name || raw.profile_name || "Unknown Lawyer");
  const languagesArr = parseLanguages(raw.languages || []);
  // accept practice_areas array or string
  const practiceAreas = Array.isArray(raw.practice_areas) ? raw.practice_areas.map(String) :
    (raw.practice_areas && typeof raw.practice_areas === "string" ? raw.practice_areas.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean) : []);
  const city = extractCityFromLocation(raw.location || "") || "";
  const experienceYears = parseExperienceYears(raw.experience || "");
  const courtType = deriveCourtType(raw.forums_of_practice || []);
  // build id (prefer email, else phone, else fallback)
  const id = (raw.email && String(raw.email).trim()) || (raw.phone && String(raw.phone).trim()) || `${name.replace(/\s+/g, "-").toLowerCase()}-${idx}`;
  const consultationFee = raw.consultation_fee || raw.fee || raw.consultationFee || "Not specified";
  const emailCandidate = (raw.email || raw.Email || raw.contact_email || "").toString().trim();
  return {
    id,
    name,
    rawLocation: raw.location || "",
    city: (city || "").trim().toLowerCase(),
    experienceText: raw.experience || `${experienceYears} years of experience`,
    experienceYears,
    languagesArr,
    practiceAreas,
    forums: raw.forums_of_practice || [],
    courtType,
    phone: raw.phone || raw.contact_phone || raw.contact || "",
    email: emailCandidate,
    website: raw.website || raw.profile_url || "",
    consultationFee,
    image_url: raw.image_url || raw.image || "",
    bio: raw.bio || raw.description || "",
    linkedin: raw.linkedin || "",
    _raw: raw,
  };
};

/* ---------------------------- FindLawyer component ------------------------------ */

const FindLawyer = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Lawyers");
  const [filters, setFilters] = useState({
    location: "",
    experience: "",
    courtType: "",
    language: "",
    consultationFee: "",
    practiceArea: "",
  });

  // show/hide expanded bio per lawyer id
  const [expandedBio, setExpandedBio] = useState({});

  const toggleBio = (id) => setExpandedBio((s) => ({ ...s, [id]: !s[id] }));

  // normalize + dedupe
  const lawyers = useMemo(() => {
    if (!Array.isArray(lawyersData)) return [];
    const normalized = lawyersData.map((l, i) => normalizeLawyer(l, i));
    const map = new Map();
    normalized.forEach((l) => { if (!map.has(l.id)) map.set(l.id, l); });
    return Array.from(map.values());
  }, []);

  // dynamic options (deduped)
  const dynamicOptions = useMemo(() => {
    const cityMap = new Map();
    const courtMap = new Map();
    const langMap = new Map();
    const feeMap = new Map();
    const practiceMap = new Map();

    lawyers.forEach((l) => {
      const cNorm = (l.city || "").toString().trim().toLowerCase();
      if (cNorm) cityMap.set(cNorm, cNorm.charAt(0).toUpperCase() + cNorm.slice(1));
      const ct = (l.courtType || "").toString().trim();
      if (ct && ct !== "Other") courtMap.set(ct, ct);
      (l.languagesArr || []).forEach((lang) => { const ln = (lang || "").toString().trim(); if (ln) langMap.set(ln, ln); });
      const fee = (l.consultationFee || "Not specified").toString().trim();
      if (fee) feeMap.set(fee, fee);
      (l.practiceAreas || []).forEach((pa) => { const pan = (pa || "").toString().trim(); if (pan) practiceMap.set(pan, pan); });
    });

    return {
      cities: Array.from(cityMap.entries()).map(([value, label]) => ({ value, label })),
      courtTypes: Array.from(courtMap.keys()).sort(),
      languages: Array.from(langMap.keys()).sort(),
      fees: Array.from(feeMap.keys()).sort(),
      practiceAreas: Array.from(practiceMap.keys()).sort(),
    };
  }, [lawyers]);

  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));

  const filteredLawyers = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return lawyers
      .filter((lawyer) => {
        if (q) {
          const inName = lawyer.name.toLowerCase().includes(q);
          const inPractice = (lawyer.practiceAreas || []).join(" ").toLowerCase().includes(q);
          const inCity = (lawyer.city || "").toLowerCase().includes(q);
          const inLocation = (lawyer.rawLocation || "").toLowerCase().includes(q);
          if (!inName && !inPractice && !inCity && !inLocation) return false;
        }
        if (selectedCategory !== "All Lawyers") {
          const keywords = categoryKeywords[selectedCategory] || [];
          const spec = (lawyer.practiceAreas || []).join(" ").toLowerCase();
          if (!keywords.some((k) => spec.includes(k.toLowerCase()))) return false;
        }
        if (filters.location) {
          if ((lawyer.city || "").toLowerCase() !== filters.location.toLowerCase()) return false;
        }
        if (filters.experience) {
          const maxYears = parseInt(filters.experience, 10);
          if (!isNaN(maxYears) && lawyer.experienceYears >= maxYears) return false;
        }
        if (filters.courtType) {
          if ((lawyer.courtType || "").toLowerCase() !== filters.courtType.toLowerCase()) return false;
        }
        if (filters.language) {
          const langs = (lawyer.languagesArr || []).map((x) => x.toLowerCase());
          if (!langs.includes(filters.language.toLowerCase())) return false;
        }
        if (filters.consultationFee) {
          if ((lawyer.consultationFee || "Not specified") !== filters.consultationFee) return false;
        }
        if (filters.practiceArea) {
          const paText = (lawyer.practiceAreas || []).join(" ").toLowerCase();
          if (!paText.includes(filters.practiceArea.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => b.experienceYears - a.experienceYears);
  }, [lawyers, searchQuery, selectedCategory, filters]);

  // find linkedin url in a variety of fields
  const findLinkedInUrl = (lawyer) => {
    if (!lawyer) return "";
    if (lawyer.linkedin && lawyer.linkedin.toLowerCase().includes("linkedin")) return lawyer.linkedin;
    const site = (lawyer.website || "").toLowerCase();
    if (site.includes("linkedin.com")) return lawyer.website;
    return lawyer._raw?.linkedin || "";
  };

  // sanitize email for UI & for passing to booking page
  const sanitizeEmail = (email) => {
    if (!email) return "";
    const e = String(email).trim();
    return e.includes("@") ? e : ""; // only keep valid-looking emails
  };

  return (
    <div className="find-lawyer-page">
      <Navbar />
      <div className="find-lawyer-container">
        {/* LEFT FILTER PANEL */}
        <div className="left-section">
          <div className="advanced-filters">
            <h3 className="filter-title">Advanced Filters</h3>

            <div className="filter-group">
              <label>Location</label>
              <select value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)}>
                <option value="">All</option>
                {dynamicOptions.cities.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>

            <div className="filter-group">
              <label>Experience</label>
              <select value={filters.experience} onChange={(e) => handleFilterChange("experience", e.target.value)}>
                <option value="">All</option>
                <option value="3">Below 3 years</option>
                <option value="5">Below 5 years</option>
                <option value="10">Below 10 years</option>
                <option value="20">Below 20 years</option>
                <option value="30">Below 30 years</option>
                <option value="40">Below 40 years</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Court Type</label>
              <select value={filters.courtType} onChange={(e) => handleFilterChange("courtType", e.target.value)}>
                <option value="">All</option>
                {dynamicOptions.courtTypes.map((ct) => (<option key={ct} value={ct}>{ct}</option>))}
              </select>
            </div>

            <div className="filter-group">
              <label>Language</label>
              <select value={filters.language} onChange={(e) => handleFilterChange("language", e.target.value)}>
                <option value="">All</option>
                {dynamicOptions.languages.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
              </select>
            </div>

            <div className="filter-group">
              <label>Practice Area</label>
              <select value={filters.practiceArea || ""} onChange={(e) => handleFilterChange("practiceArea", e.target.value)}>
                <option value="">All</option>
                {dynamicOptions.practiceAreas.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="right-section">
          <div className="search-header">
            <h1 className="page-title">Find the Right Lawyer for You</h1>
            <p className="page-subtitle">Search and book verified lawyers across India</p>

            <div className="search-bar">
              <span className="search-icon"><Search size={20} /></span>
              <input placeholder="Search by name, city, specialization" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="category-buttons">
              <button className={`all-lawyers-btn ${selectedCategory === "All Lawyers" ? "active" : ""}`} onClick={() => setSelectedCategory("All Lawyers")}>All lawyers</button>
              {categories.map((cat) => (<button key={cat} className={`category-btn ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>))}
            </div>

            <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>Showing {filteredLawyers.length} of {lawyers.length} lawyers</div>
          </div>

          <div className="lawyers-list">
            {filteredLawyers.length === 0 ? (
              <p className="no-results">No lawyers found</p>
            ) : (
              filteredLawyers.map((lawyer) => {
                const linkedIn = findLinkedInUrl(lawyer);
                const bioShort = (lawyer.bio || "").trim().slice(0, 120);
                const isLongBio = (lawyer.bio || "").trim().length > 120;
                const expanded = !!expandedBio[lawyer.id];

                // pass a normalized lawyer object when navigating so BookConsultation gets consistent keys
                const normalizedForNav = {
                  id: lawyer.id,
                  name: lawyer.name,
                  email: sanitizeEmail(lawyer.email),
                  phone: lawyer.phone,
                  consultationFee: lawyer.consultationFee,
                  specialization: (lawyer.practiceAreas || []).slice(0,3).join(", "),
                  bio: lawyer.bio || "",
                  image: lawyer.image_url || "",
                  website: lawyer.website || "",
                  linkedin: linkedIn || "",
                  _raw: lawyer._raw || {}
                };

                return (
                  <div key={lawyer.id} className="lawyer-card">
                    <div className="lawyer-card-content">
                      <div className="lawyer-info">
                        <div className="lawyer-avatar">
                          <img src={lawyer.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name)}&size=80`} alt={lawyer.name} />
                        </div>

                        <div className="lawyer-details">
                          <h3>{lawyer.name}</h3>
                          <p className="specialization">{lawyer.practiceAreas.length > 0 ? lawyer.practiceAreas.slice(0, 3).join(", ") : "General Practice"}</p>

                          <div className="lawyer-meta">
                            <span><Briefcase size={14} /> {lawyer.experienceText}</span>
                            {lawyer.city && <span><MapPin size={14} /> {lawyer.city.charAt(0).toUpperCase() + lawyer.city.slice(1)}</span>}
                            {lawyer.courtType && lawyer.courtType !== "Other" && <span><Scale size={14} /> {lawyer.courtType}</span>}
                            {lawyer.languagesArr.length > 0 && <span><Languages size={14} /> {lawyer.languagesArr.join(", ")}</span>}
                          </div>

                          {/* Bio snippet + Read more */}
                          {lawyer.bio ? (
                            <div className="lawyer-bio">
                              <p style={{ margin: "6px 0 0 0" }}>
                                {expanded ? lawyer.bio : bioShort}
                                {isLongBio && !expanded ? "..." : ""}
                              </p>
                              {isLongBio && (
                                <button className="read-more-btn" onClick={(e) => { e.stopPropagation(); toggleBio(lawyer.id); }}>
                                  {expanded ? "Show less" : "Read more"}
                                </button>
                              )}
                            </div>
                          ) : null}

                          {/* Contact row: phone + linkedin + email */}
                          <div className="lawyer-contact" style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            {lawyer.phone ? (
                              <a href={`tel:${lawyer.phone}`} onClick={(e) => e.stopPropagation()} className="contact-pill">
                                <Phone size={14} style={{ verticalAlign: "middle" }} /> <span style={{ marginLeft: 6 }}>{lawyer.phone}</span>
                              </a>
                            ) : null}

                            {linkedIn ? (
                              <a href={linkedIn} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="contact-pill">
                                <ExternalLink size={14} style={{ verticalAlign: "middle" }} /> <span style={{ marginLeft: 6 }}>LinkedIn</span>
                              </a>
                            ) : null}

                            {/* email optional (display only if valid-looking) */}
                            {lawyer.email && lawyer.email.includes("@") ? (
                              <a href={`mailto:${lawyer.email}`} onClick={(e) => e.stopPropagation()} className="contact-pill">
                                <span style={{ marginLeft: 2 }}>{lawyer.email}</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button className="book-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            // pass normalized object to avoid missing keys
                            navigate("/book-consultation", { state: { lawyer: normalizedForNav } });
                          }}>
                          Book Consultation
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindLawyer;
