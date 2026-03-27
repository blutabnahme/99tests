"use client";

import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function PatientHeader({ patient }: { patient: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('hc.patientEdit');
  const [formData, setFormData] = useState({
    first_name: patient.first_name || "",
    last_name: patient.last_name || "",
    contact_email: patient.contact_email || "",
    phone: patient.phone || "",
    gender: patient.gender || "",
    date_of_birth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
    address: {
      street: patient.address?.street || "",
      zip: patient.address?.zip || "",
      city: patient.address?.city || ""
    },
    insurance_type: patient.insurance_type || ""
  });

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to update patient");
      setIsModalOpen(false);
      router.refresh(); // Refresh to pull updated server data
    } catch (err) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-light text-primary-dark rounded-2xl flex items-center justify-center border border-primary-light shadow-sm shrink-0">
            <span className="font-heading text-2xl font-bold">{patient.first_name[0]}{patient.last_name[0]}</span>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight mb-1">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-[14px] text-gray-500 m-0">
              {patient.contact_email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border border-gray-200 text-gray-500 hover:text-near-black hover:border-gray-300 bg-transparent rounded-full px-5 py-3 text-[14px] font-semibold flex items-center gap-2 transition-all"
          >
            <Pencil className="w-4 h-4" />
            {t('editPatient')}
          </button>
          <Link 
            href={`/dashboard/recommendations/new?email=${encodeURIComponent(patient.contact_email)}`}
            className="bg-primary hover:bg-primary-dark text-white rounded-full px-6 py-3 text-[14px] font-semibold flex items-center gap-2 transition-all"
          >
            <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
            {t('createNewCase')}
          </Link>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="font-heading text-xl font-medium text-near-black">{t('modalTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('firstName')}</label>
                  <input 
                    type="text" 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('lastName')}</label>
                  <input 
                    type="text" 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('email')}</label>
                  <input 
                    type="email" 
                    value={formData.contact_email} 
                    onChange={e => setFormData({...formData, contact_email: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('phone')}</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('gender')}</label>
                  <select 
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5H7z%22%20fill%3D%22%239CA3AF%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center]"
                  >
                    <option value="">{t('selectGender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="diverse">{t('diverse')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('dob')}</label>
                  <input 
                    type="date" 
                    value={formData.date_of_birth} 
                    onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('streetAddress')}</label>
                <input 
                  type="text" 
                  value={formData.address.street} 
                  onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                  className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('postalCode')}</label>
                  <input 
                    type="text" 
                    value={formData.address.zip} 
                    onChange={e => setFormData({...formData, address: {...formData.address, zip: e.target.value}})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('city')}</label>
                  <input 
                    type="text" 
                    value={formData.address.city} 
                    onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                    className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('insurance')}</label>
                <input 
                  type="text" 
                  value={formData.insurance_type} 
                  onChange={e => setFormData({...formData, insurance_type: e.target.value})}
                  placeholder={t('insurancePlaceholder')}
                  className="w-full bg-white border border-[#D4D4D4] rounded-xl px-4 py-2.5 text-[14px] font-body outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-shadow"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 mt-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full font-semibold text-gray-500 hover:text-near-black border border-transparent hover:border-gray-300 hover:bg-transparent bg-transparent transition-all text-[14px]"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full font-semibold text-white bg-primary hover:bg-primary-dark transition-all text-[14px] disabled:opacity-50"
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
