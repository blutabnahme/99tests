"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, MessageCircle } from "lucide-react";
import { FlagIcon } from "@/components/ui/FlagIcon";

type FAQ = {
  id: string;
  category: "companies" | "collectors" | "patients" | "payments" | "platform";
  sort_order: number;
  is_published: boolean;
  question_en: string;
  question_de: string | null;
  question_es: string | null;
  question_nl: string | null;
  question_fr: string | null;
  answer_en: string;
  answer_de: string | null;
  answer_es: string | null;
  answer_nl: string | null;
  answer_fr: string | null;
};

const CATEGORIES = ["companies", "collectors", "patients", "payments", "platform"] as const;

type LanguageCode = "en" | "de" | "es" | "nl" | "fr";
const LANGUAGES: { code: LanguageCode, flag: string }[] = [
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "es", flag: "🇪🇸" },
  { code: "nl", flag: "🇳🇱" },
  { code: "fr", flag: "🇫🇷" },
];

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Translation Tab State
  const [activeLang, setActiveLang] = useState<LanguageCode>("en");

  // Form State
  const [formData, setFormData] = useState({
    category: "companies",
    sort_order: 0,
    is_published: true,
    question_en: "",
    question_de: "",
    question_es: "",
    question_nl: "",
    question_fr: "",
    answer_en: "",
    answer_de: "",
    answer_es: "",
    answer_nl: "",
    answer_fr: "",
  });

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/admin/faq");
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      const data = await res.json();
      setFaqs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenModal = (faq?: FAQ) => {
    setActiveLang("en"); // Reset to EN tab
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        category: faq.category,
        sort_order: faq.sort_order,
        is_published: faq.is_published,
        question_en: faq.question_en || "",
        question_de: faq.question_de || "",
        question_es: faq.question_es || "",
        question_nl: faq.question_nl || "",
        question_fr: faq.question_fr || "",
        answer_en: faq.answer_en || "",
        answer_de: faq.answer_de || "",
        answer_es: faq.answer_es || "",
        answer_nl: faq.answer_nl || "",
        answer_fr: faq.answer_fr || "",
      });
    } else {
      setEditingFaq(null);
      setFormData({
        category: "companies",
        sort_order: 0,
        is_published: true,
        question_en: "",
        question_de: "",
        question_es: "",
        question_nl: "",
        question_fr: "",
        answer_en: "",
        answer_de: "",
        answer_es: "",
        answer_nl: "",
        answer_fr: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFaq(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/admin/faq";
      const method = editingFaq ? "PATCH" : "POST";
      
      // Clean up empty strings to null for the database
      const cleanData = { ...formData };
      (['de', 'es', 'nl', 'fr'] as const).forEach(lang => {
        if (!cleanData[`question_${lang}`].trim()) (cleanData as any)[`question_${lang}`] = null;
        if (!cleanData[`answer_${lang}`].trim()) (cleanData as any)[`answer_${lang}`] = null;
      });

      const body = editingFaq ? { id: editingFaq.id, ...cleanData } : cleanData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save FAQ");
      await fetchFaqs();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert("Error saving FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete FAQ");
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      alert("Error deleting FAQ");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_published: !currentStatus } : f))
    );
    try {
      const res = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_published: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
    } catch (error) {
      console.error(error);
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_published: currentStatus } : f))
      );
      alert("Error toggling publish status");
    }
  };

  const filteredFaqs = filter === "all" ? faqs : faqs.filter((f) => f.category === filter);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "companies": return "bg-primary/10 text-primary";
      case "collectors": return "bg-[#008085]/10 text-[#008085]";
      case "patients": return "bg-blue-50 text-blue-600";
      case "payments": return "bg-amber-50 text-amber-600";
      case "platform": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  // Helper validation to show the green dot / gray dot indicator
  const hasTranslation = (lang: LanguageCode) => {
    const qKey = `question_${lang}` as keyof typeof formData;
    const aKey = `answer_${lang}` as keyof typeof formData;
    return !!((formData[qKey] as string)?.trim() && (formData[aKey] as string)?.trim());
  };

  return (
    <div className="flex-1 min-w-0 w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
            FAQ Management
          </h1>
          <p className="text-[14px] text-gray-500">
            Manage frequently asked questions displayed on the public FAQ page.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* TABS - Desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
            filter === "all" ? "bg-near-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors capitalize ${
              filter === cat ? "bg-near-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FILTER - Mobile */}
      <div className="block sm:hidden mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-11 rounded-full border border-gray-200 px-4 text-[14px] font-medium bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none appearance-none capitalize"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="capitalize">{cat}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-300" />
            <span className="text-[14px]">Loading FAQs...</span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-[14px]">No FAQs found in this category.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize self-start sm:self-auto ${getCategoryColor(faq.category)}`}>
                  {faq.category}
                </span>

                <span className="flex-1 text-[14px] text-near-black font-medium text-left truncate">
                  {faq.question_en}
                </span>

                <div className="flex items-center gap-3 shrink-0 mt-3 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] w-16 text-right font-medium ${faq.is_published ? 'text-primary' : 'text-gray-400'}`}>
                      {faq.is_published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={() => handleTogglePublish(faq.id, faq.is_published)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 shrink-0 ${
                        faq.is_published ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          faq.is_published ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="w-px h-5 bg-gray-200"></div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(faq)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[16px] font-medium text-near-black">
                {editingFaq ? "Edit Question" : "Add New Question"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              
              {/* LANGUAGE TABS */}
              <div className="flex items-center gap-1 mb-6 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLang(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      activeLang === lang.code 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <FlagIcon locale={lang.code} className="w-4 h-3 rounded-[2px] object-cover shrink-0" />
                    <span>{lang.code.toUpperCase()}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${hasTranslation(lang.code) ? "bg-green-400" : "bg-gray-300"}`}></span>
                  </button>
                ))}
                
                {activeLang !== "en" && !hasTranslation(activeLang) && (
                  <span className="text-[11px] text-gray-400 ml-2 italic">Not translated</span>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Question ({activeLang.toUpperCase()}) {activeLang === "en" && "*"}
                  </label>
                  <input
                    required={activeLang === "en"}
                    autoFocus
                    type="text"
                    value={(formData as any)[`question_${activeLang}`]}
                    onChange={(e) => setFormData({ ...formData, [`question_${activeLang}`]: e.target.value })}
                    className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
                    placeholder={activeLang === "en" ? "E.g. How do I reset my password?" : `Translation in ${activeLang.toUpperCase()}...`}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Answer ({activeLang.toUpperCase()}) {activeLang === "en" && "*"}
                  </label>
                  <textarea
                    required={activeLang === "en"}
                    rows={4}
                    value={(formData as any)[`answer_${activeLang}`]}
                    onChange={(e) => setFormData({ ...formData, [`answer_${activeLang}`]: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors resize-none leading-relaxed"
                    placeholder={activeLang === "en" ? "Provide a clear, concise answer..." : `Translation in ${activeLang.toUpperCase()}...`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full h-10 rounded-full border border-gray-200 px-4 pr-8 text-[14px] bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors appearance-none cursor-pointer capitalize"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full h-10 rounded-full border border-gray-200 px-4 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-[13px] font-medium text-near-black">Published Status</div>
                    <div className="text-[12px] text-gray-500">Will this be visible on the public FAQ page?</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 shrink-0 ${
                      formData.is_published ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      formData.is_published ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-transparent border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-near-black rounded-full font-semibold transition-all text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full text-[13px] font-semibold bg-primary text-white hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
