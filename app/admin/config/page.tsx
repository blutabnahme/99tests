"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Activity,
  Users,
  Route as RouteIcon,
  Building2,
  Truck,
  Receipt,
  Package,
  Percent,
  Settings2,
  BellRing,
  RefreshCcw,
  ShieldCheck,
  Code2,
  Webhook,
  Save,
  Plus,
  ChevronDown,
  RotateCw,
  Snowflake
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/components/ui/Toast";

// ─── UI Helpers ───
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div onClick={onChange} className="flex items-center justify-between cursor-pointer group">
      <span className="text-[14px] font-medium text-near-black group-hover:text-primary-dark transition-colors">{label}</span>
      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${checked ? "bg-primary" : "bg-gray-300"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

function SaveBar({ onSave, loading = false, disabled = false }: { onSave: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end pt-5 mt-5 border-t border-gray-200">
      <button 
        onClick={onSave}
        disabled={loading || disabled}
        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-full shadow-[0_2px_8px_#BE1E2D33] transition-all w-full sm:w-auto"
      >
        <Save className="w-4 h-4" />
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-5 shadow-sm">{children}</div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-open-bg flex items-center justify-center shrink-0 border border-primary-light">
        <Icon className="w-[18px] h-[18px] text-primary-dark" />
      </div>
      <div>
        <h3 className="font-heading text-[16px] font-medium text-near-black leading-tight">{title}</h3>
        {subtitle && <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── TAB COMPONENTS ───

function PricingTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.pricing || {};
  const [urgentPct, setUrgentPct] = useState(data.urgent_surcharge_pct?.toString() || "25");
  const [emergencyPct, setEmergencyPct] = useState(data.emergency_surcharge_pct?.toString() || "50");
  const [specialToggle, setSpecialToggle] = useState(data.special_case_enabled ?? true);
  const [specialPct, setSpecialPct] = useState(data.special_case_surcharge_pct?.toString() || "15");
  const [perKm, setPerKm] = useState(data.travel_fee_per_km?.toString() || "1.50");
  const [minFee, setMinFee] = useState(data.min_bc_fee?.toString() || "15");
  const [maxFee, setMaxFee] = useState(data.max_bc_fee?.toString() || "100");
  const [minPayout, setMinPayout] = useState(data.min_bc_payout?.toString() || "12.50");

  const onSave = () => {
    saveConfig('pricing', {
      urgent_surcharge_pct: Number(urgentPct),
      emergency_surcharge_pct: Number(emergencyPct),
      special_case_enabled: specialToggle,
      special_case_surcharge_pct: Number(specialPct),
      travel_fee_per_km: Number(perKm),
      min_bc_fee: Number(minFee),
      max_bc_fee: Number(maxFee),
      min_bc_payout: Number(minPayout)
    });
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      <SectionCard>
        <SectionTitle icon={Activity} title="Urgency Surcharges" subtitle="Percentage added to base fee for urgent and emergency recommendations." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Normal</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">+</span>
              <Input value="0" disabled className="pl-7 bg-gray-50 font-mono" />
              <span className="absolute right-3 top-2.5 text-gray-500 font-medium">%</span>
            </div>
          </div>
          <div>
            <Label>Urgent</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">+</span>
              <Input value={urgentPct} onChange={e => setUrgentPct(e.target.value)} className="pl-7 pr-8 font-mono" />
              <span className="absolute right-3 top-2.5 text-gray-500">%</span>
            </div>
          </div>
          <div>
            <Label>Emergency</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">+</span>
              <Input value={emergencyPct} onChange={e => setEmergencyPct(e.target.value)} className="pl-7 pr-8 font-mono" />
              <span className="absolute right-3 top-2.5 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </SectionCard>
      
      <SectionCard>
        <SectionTitle icon={Users} title="Special Recommendation Surcharges" subtitle="Additional fee for minor, elderly, or difficult vein recommendations." />
        <div className="mb-4 max-w-sm"><Toggle checked={specialToggle} onChange={() => setSpecialToggle(!specialToggle)} label="Enable special recommendation surcharges" /></div>
        {specialToggle && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Minor</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-gray-500">+</span>
                  <Input value={specialPct} onChange={e => setSpecialPct(e.target.value)} className="pl-7 pr-8 font-mono" />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>Elderly</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-gray-500">+</span>
                  <Input value={specialPct} onChange={e => setSpecialPct(e.target.value)} className="pl-7 pr-8 font-mono" />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label>Difficult veins</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-gray-500">+</span>
                  <Input value={specialPct} onChange={e => setSpecialPct(e.target.value)} className="pl-7 pr-8 font-mono" />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>
            </div>
            <div className="text-[12px] text-gray-500 mt-3">When disabled, these flags are informational only and don't affect pricing.</div>
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={RouteIcon} title="Travel & Fee Bounds" subtitle="Per-km rate and min/max BC fee limits." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Travel Rate</Label>
            <div className="relative mt-1">
              <Input value={perKm} onChange={e => setPerKm(e.target.value)} className="pl-8 font-mono" />
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <span className="absolute right-3 top-2.5 text-gray-500 text-[11px] mt-0.5">/km</span>
            </div>
          </div>
          <div>
            <Label>Min BC Fee</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={minFee} onChange={e => setMinFee(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
          <div>
            <Label>Max BC Fee</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={maxFee} onChange={e => setMaxFee(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
          <div>
            <Label>Min Payout</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={minPayout} onChange={e => setMinPayout(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
        </div>
      </SectionCard>
      <SaveBar onSave={onSave} loading={saving} />
    </div>
  );
}

function FeesTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.fees || {};
  const [practiceOrg, setPracticeOrg] = useState(data.practice_org_fee?.toString() || "20.00");
  const [homeOrg, setHomeOrg] = useState(data.home_org_fee?.toString() || "35.00");
  const [logisticsFee, setLogisticsFee] = useState(data.return_shipping_fee?.toString() || "12.00");
  const [materialShipping, setMaterialShipping] = useState(data.material_shipping_fee?.toString() || "8.50");

  const onSave = () => {
    saveConfig('fees', {
      practice_org_fee: Number(practiceOrg),
      home_org_fee: Number(homeOrg),
      return_shipping_fee: Number(logisticsFee),
      material_shipping_fee: Number(materialShipping)
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <SectionTitle icon={Building2} title="B2B Organization Fees" subtitle="Charged to healthcare companies per recommendation. Can be overridden per-Doctor." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Practice Visit</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={practiceOrg} onChange={e => setPracticeOrg(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
          <div>
            <Label>Home Visit</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={homeOrg} onChange={e => setHomeOrg(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon={Truck} title="Logistics Fees" subtitle="Charged when the platform handles material shipping or return logistics." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Material Shipping</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={materialShipping} onChange={e => setMaterialShipping(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
          <div>
            <Label>Return Shipping</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500">€</span>
              <Input value={logisticsFee} onChange={e => setLogisticsFee(e.target.value)} className="pl-8 font-mono" />
            </div>
          </div>
        </div>
      </SectionCard>
      <SaveBar onSave={onSave} loading={saving} />
    </div>
  );
}

function TaxTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.tax || {};
  const [vatRate, setVatRate] = useState(data.vat_rate_pct?.toString() || "19");
  const onSave = () => saveConfig('tax', { vat_rate_pct: Number(vatRate) });
  
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <SectionTitle icon={Receipt} title="VAT Configuration" subtitle="Applied to all displayed prices and invoices." />
        <div className="max-w-[200px]">
          <Label>VAT Rate</Label>
          <div className="relative mt-1">
            <Input value={vatRate} onChange={e => setVatRate(e.target.value)} className="pr-8 font-mono" />
            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
          </div>
        </div>
        <div className="text-[13px] text-gray-500 mt-3 leading-relaxed">
          Standard German VAT: 19%. Reduced rate: 7%. Change only if legally required based on billing origin.
        </div>
        <SaveBar onSave={onSave} loading={saving} />
      </SectionCard>
    </div>
  );
}

function MaterialsTab({ materials, toggleMaterial, setMaterials }: { materials: any[], toggleMaterial: any, setMaterials: any }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [modal, setModal] = useState<{isOpen: boolean, isEditing: boolean, id?: string, name: string, type: string, price: string, is_active: boolean, requires_centrifuge: boolean, requires_refrigeration: boolean}>({
    isOpen: false,
    isEditing: false,
    name: "",
    type: "Tube",
    price: "",
    is_active: true,
    requires_centrifuge: false,
    requires_refrigeration: false
  });
  const [saving, setSaving] = useState(false);

  const openAddModal = () => setModal({ isOpen: true, isEditing: false, name: "", type: "Tube", price: "", is_active: true, requires_centrifuge: false, requires_refrigeration: false });
  const openEditModal = (m: any) => setModal({ isOpen: true, isEditing: true, id: m.id, name: m.name, type: m.type || "Tube", price: m.price.toString(), is_active: m.is_active, requires_centrifuge: m.requires_centrifuge || false, requires_refrigeration: m.requires_refrigeration || false });

  const handleSave = async () => {
    if (!modal.name || !modal.price) return;
    setSaving(true);
    try {
      const payload = {
        id: modal.isEditing ? modal.id : `mat-${Date.now()}`,
        name: modal.name,
        type: modal.type,
        price: Number(modal.price),
        is_active: modal.is_active,
        requires_centrifuge: modal.requires_centrifuge,
        requires_refrigeration: modal.requires_refrigeration
      };
      
      const { error } = await supabase.from('material_catalog').upsert(payload);
      if (error) throw error;
      
      // Update local state
      if (modal.isEditing) {
        setMaterials((prev: any[]) => prev.map(m => m.id === modal.id ? { ...m, ...payload } : m));
      } else {
        setMaterials((prev: any[]) => [...prev, payload].sort((a,b) => a.name.localeCompare(b.name)));
      }
      setModal({ ...modal, isOpen: false });
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleHandling = async (id: string, field: 'requires_centrifuge' | 'requires_refrigeration', current: boolean) => {
    try {
      const { error } = await supabase.from('material_catalog').update({ [field]: !current }).eq('id', id);
      if (error) throw error;
      setMaterials((prev: any[]) => prev.map(m => m.id === id ? { ...m, [field]: !current } : m));
    } catch (err) {
      console.error(`Failed to toggle ${field}:`, err);
      showToast('Failed to update handling requirement. Please try again.', 'error');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <SectionTitle icon={Package} title="Material Catalog" subtitle="Items available for Doctor recommendation creation. Prices are per unit excluding VAT." />
          <button onClick={openAddModal} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-open-bg text-primary-dark hover:bg-primary-light text-[13px] font-semibold rounded-full transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden sm:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Centrifuge</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Refrigeration</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-[14px] font-semibold text-near-black">{m.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-gray-100 text-gray-500">
                        {m.type || 'Supply'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-mono text-near-black">€{m.price.toFixed(2)}</td>
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center">
                        <div onClick={() => toggleHandling(m.id, 'requires_centrifuge', m.requires_centrifuge || false)} className={`cursor-pointer w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${m.requires_centrifuge ? "bg-primary" : "bg-gray-200"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${m.requires_centrifuge ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center">
                        <div onClick={() => toggleHandling(m.id, 'requires_refrigeration', m.requires_refrigeration || false)} className={`cursor-pointer w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${m.requires_refrigeration ? "bg-primary" : "bg-gray-200"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${m.requires_refrigeration ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(m)}
                        className="px-3 py-1 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleMaterial(m.id, m.is_active)}
                        className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                          m.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-[14px]">No materials found in catalog. Run migration 004 to seed.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="block sm:hidden flex flex-col">
            {materials.map((m) => (
              <div key={m.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors flex flex-col gap-3">
                <div className="flex justify-between items-start font-medium text-near-black gap-4">
                  <div className="text-[14px] pr-2 break-words leading-tight">{m.name}</div>
                  <div className="text-[14px] font-mono shrink-0">€{m.price.toFixed(2)}</div>
                </div>
                {((m.requires_centrifuge) || (m.requires_refrigeration)) && (
                  <div className="flex flex-wrap gap-2 text-[12px] text-gray-500">
                    {m.requires_centrifuge && <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-100"><RotateCw className="w-3.5 h-3.5 text-blue-500" /> Centrifuge</div>}
                    {m.requires_refrigeration && <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-100"><Snowflake className="w-3.5 h-3.5 text-blue-400" /> Refrigerated</div>}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500">
                    {m.type || 'Supply'}
                  </span>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(m)} className="px-3 py-1 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">Edit</button>
                    <button onClick={() => toggleMaterial(m.id, m.is_active)} className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${m.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{m.is_active ? "Active" : "Inactive"}</button>
                  </div>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-[13px]">No materials found in catalog.</div>
            )}
          </div>
        </div>

        {/* Modal Overlay */}
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[20px] shadow-xl border border-gray-200 max-w-[420px] w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-heading text-[18px] font-medium text-near-black">{modal.isEditing ? "Edit Material" : "Add New Material"}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label>Item Name</Label>
                  <Input value={modal.name} onChange={e => setModal({...modal, name: e.target.value})} placeholder="e.g. EDTA Tube (Lavender)" />
                </div>
                <div>
                  <Label>Type</Label>
                  <select 
                    value={modal.type} 
                    onChange={e => setModal({...modal, type: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[14px] bg-white outline-none focus:border-primary"
                  >
                    <option value="Tube">Blood Tube</option>
                    <option value="Needle">Needle / Butterfly</option>
                    <option value="Supply">General Supply</option>
                    <option value="Container">Container</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">€</span>
                    <Input type="number" step="0.01" value={modal.price} onChange={e => setModal({...modal, price: e.target.value})} className="pl-8" placeholder="0.00" />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <Toggle checked={modal.requires_centrifuge} onChange={() => setModal({...modal, requires_centrifuge: !modal.requires_centrifuge})} label="Requires Centrifuge" />
                  <Toggle checked={modal.requires_refrigeration} onChange={() => setModal({...modal, requires_refrigeration: !modal.requires_refrigeration})} label="Requires Refrigeration" />
                  <Toggle checked={modal.is_active} onChange={() => setModal({...modal, is_active: !modal.is_active})} label="Item is Active" />
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3 mt-4">
                <button onClick={() => setModal({...modal, isOpen: false})} className="px-4 py-2 rounded-lg text-[14px] font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-[14px] font-semibold transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px]">
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function CommissionTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.commission || {};
  const [rate, setRate] = useState(data.default_platform_rate_pct?.toString() || "17.5");
  const onSave = () => saveConfig('commission', { default_platform_rate_pct: Number(rate) });
  
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <SectionTitle icon={Percent} title="Default Commission" subtitle="Applied to all BCs unless overridden." />
        <div className="max-w-[200px]">
          <Label>Platform Commission Rate</Label>
          <div className="relative mt-1">
            <Input value={rate} onChange={e => setRate(e.target.value)} className="pr-8 font-mono" />
            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
          </div>
        </div>
        <div className="text-[13px] text-gray-500 mt-3">Deducted from BC payout. Min payout rule still applies.</div>
      </SectionCard>
      <SaveBar onSave={onSave} loading={saving} />
    </div>
  );
}

function AlertsTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.alerts || {};
  const [unmatched, setUnmatched] = useState(data.unmatched_case_hours?.toString() || "24");
  const [attempts, setAttempts] = useState(data.scheduling_conflict_attempts?.toString() || "3");
  const [conflictHrs, setConflictHrs] = useState(data.scheduling_conflict_hours?.toString() || "72");
  const [cancelT, setCancelT] = useState(data.bc_cancellation_threshold_30_days?.toString() || "3");
  const [fallback, setFallback] = useState(data.auto_fallback_enabled ?? true);
  const [fallbackHrs, setFallbackHrs] = useState(data.auto_fallback_hours?.toString() || "72");
  const [reverify, setReverify] = useState(data.re_verification_alert_days?.toString() || "30");

  const onSave = () => saveConfig('alerts', {
    unmatched_case_hours: Number(unmatched),
    scheduling_conflict_attempts: Number(attempts),
    scheduling_conflict_hours: Number(conflictHrs),
    bc_cancellation_threshold_30_days: Number(cancelT),
    auto_fallback_enabled: fallback,
    auto_fallback_hours: Number(fallbackHrs),
    re_verification_alert_days: Number(reverify)
  });

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <SectionTitle icon={BellRing} title="Recommendation Monitoring Alerts" subtitle="Thresholds for automatic admin notifications." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Unmatched recommendation alert</Label>
            <div className="relative mt-1">
              <Input value={unmatched} onChange={e => setUnmatched(e.target.value)} className="pr-14" />
              <span className="absolute right-3 top-2.5 text-gray-500">hours</span>
            </div>
          </div>
          <div>
            <Label>Scheduling conflict: failed attempts</Label>
            <div className="relative mt-1">
              <Input value={attempts} onChange={e => setAttempts(e.target.value)} className="pr-20" />
              <span className="absolute right-3 top-2.5 text-gray-500">attempts</span>
            </div>
          </div>
          <div>
            <Label>Scheduling conflict: max time</Label>
            <div className="relative mt-1">
              <Input value={conflictHrs} onChange={e => setConflictHrs(e.target.value)} className="pr-14" />
              <span className="absolute right-3 top-2.5 text-gray-500">hours</span>
            </div>
          </div>
          <div>
            <Label>BC cancellation threshold</Label>
            <div className="relative mt-1">
              <Input value={cancelT} onChange={e => setCancelT(e.target.value)} className="pr-24" />
              <span className="absolute right-3 top-2.5 text-gray-500 text-[13px] mt-0.5">in 30 days</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={RefreshCcw} title="Auto-Fallback (Doctor Curates Mode)" subtitle="If Doctor doesn't send shortlist in time, auto-switch to Patient Decides." />
        <div className="max-w-sm mb-4"><Toggle checked={fallback} onChange={() => setFallback(!fallback)} label="Enable auto-fallback dispatch" /></div>
        {fallback && (
          <div className="max-w-[200px]">
            <Label>Fallback after</Label>
            <div className="relative mt-1">
              <Input value={fallbackHrs} onChange={e => setFallbackHrs(e.target.value)} className="pr-14" />
              <span className="absolute right-3 top-2.5 text-gray-500">hours</span>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={ShieldCheck} title="Re-Verification" subtitle="Optional document re-verification timers." />
        <div className="max-w-[200px]">
          <Label>Non-response alert after</Label>
          <div className="relative mt-1">
            <Input value={reverify} onChange={e => setReverify(e.target.value)} className="pr-14" />
            <span className="absolute right-3 top-2.5 text-gray-500">days</span>
          </div>
        </div>
      </SectionCard>
      
      <SaveBar onSave={onSave} loading={saving} />
    </div>
  );
}

function ApiTab({ config, saveConfig, saving }: { config: any, saveConfig: any, saving: boolean }) {
  const data = config.api || {};
  const [rateLim, setRateLim] = useState(data.global_rate_limit_req_min?.toString() || "100");
  const onSave = () => saveConfig('api', { global_rate_limit_req_min: Number(rateLim) });

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionCard>
        <SectionTitle icon={Code2} title="REST API Settings" subtitle="Global rate limits for external consumer apps." />
        <div className="max-w-[200px]">
          <Label>Global Rate Limit</Label>
          <div className="relative mt-1">
            <Input value={rateLim} onChange={e => setRateLim(e.target.value)} className="pr-20 font-mono" />
            <span className="absolute right-3 top-2.5 text-gray-500 text-[13px] mt-0.5">req/min</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Webhook} title="Webhooks" subtitle="Doctor webhook endpoints for event notifications." />
        <div className="text-[13.5px] text-gray-500 leading-relaxed mb-4">
          Webhook URLs are configured per-Healthcare Provider in their individual company settings. 
          <div className="mt-3 text-[13px] font-medium text-gray-600 mb-2">Events dispatched:</div>
          <div className="flex flex-wrap gap-2">
            <code className="px-2 py-1 bg-gray-100 rounded-md text-primary-dark font-medium text-[11px] sm:text-[12px]">recommendation.matched</code>
            <code className="px-2 py-1 bg-gray-100 rounded-md text-primary-dark font-medium text-[11px] sm:text-[12px]">recommendation.bc_selected</code>
            <code className="px-2 py-1 bg-gray-100 rounded-md text-primary-dark font-medium text-[11px] sm:text-[12px]">recommendation.completed</code>
            <code className="px-2 py-1 bg-gray-100 rounded-md text-primary-dark font-medium text-[11px] sm:text-[12px]">shortlist.sent</code>
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 text-blue-800 text-[13px] px-4 py-3 rounded-xl flex items-center gap-3">
          <Settings2 className="w-5 h-5 shrink-0 text-blue-500" />
          Webhook delivery logs are available in the API Logs database view.
        </div>
      </SectionCard>
      
      <SaveBar onSave={onSave} loading={saving} />
    </div>
  );
}

// ─── MAIN PAGE ───
const tabs = [
  { id: "pricing", label: "Pricing", icon: Activity },
  { id: "fees", label: "Fees", icon: Building2 },
  { id: "tax", label: "Tax", icon: Receipt },
  { id: "materials", label: "Materials", icon: Package },
  { id: "commission", label: "Commission", icon: Percent },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "api", label: "API", icon: Code2 },
];

export default function AdminConfig() {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("pricing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [materials, setMaterials] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch JSON Configs & Materials via API to bypass Next.js client caching
        const res = await fetch('/api/admin/config', { cache: 'no-store' });
        if (res.ok) {
          const { configs, materials: mats } = await res.json();
          if (configs) {
            const cfgMap: Record<string, any> = {};
            configs.forEach((c: any) => { cfgMap[c.id] = c.value; });
            setConfig(cfgMap);
          }
          if (mats) {
            setMaterials(mats);
          }
        }
      } catch (err) {
        console.error("Error fetching config:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  // Generic Save Function linking UI to DB
  const saveConfig = async (id: string, value: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value })
      });
      if (!res.ok) throw new Error("Failed to save config via API");
      
      setConfig(prev => ({ ...prev, [id]: value }));
      showToast('Settings saved successfully', 'success');
      router.refresh();
    } catch (err) {
      console.error(`Failed to save ${id}:`, err);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const toggleMaterial = async (id: string, current: boolean) => {
    try {
      await supabase.from('material_catalog').update({ is_active: !current }).eq('id', id);
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m));
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      console.error("Failed to toggle state:", err);
      showToast('Failed to save settings. Please try again.', 'error');
    }
  };

  if (loading) return (
    <div className="flex-1 p-10 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary-light border-t-99tests-red animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 min-w-0 w-full">
      <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">Configuration</h1>
      <p className="text-[13px] sm:text-[15px] text-gray-500 mb-8">Manage platform pricing, fees, materials, limits, and behavior.</p>

        {/* Tabs & Mobile Filter */}
        <div className="w-full mb-8">
          {/* Desktop Tabs */}
          <div className="hidden sm:flex flex-nowrap overflow-x-auto gap-2 border-b border-gray-200 pb-1 hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-all border-b-[3px] ${
                    isActive ? "border-primary text-primary-dark" : "border-transparent text-gray-500 hover:text-near-black hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Dropdown */}
          <div className="block sm:hidden relative w-full">
            <select 
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-near-black px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#005C5F]/20"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "pricing" && <PricingTab config={config} saveConfig={saveConfig} saving={saving} />}
        {activeTab === "fees" && <FeesTab config={config} saveConfig={saveConfig} saving={saving} />}
        {activeTab === "tax" && <TaxTab config={config} saveConfig={saveConfig} saving={saving} />}
        {activeTab === "materials" && <MaterialsTab materials={materials} toggleMaterial={toggleMaterial} setMaterials={setMaterials} />}
        {activeTab === "commission" && <CommissionTab config={config} saveConfig={saveConfig} saving={saving} />}
        {activeTab === "alerts" && <AlertsTab config={config} saveConfig={saveConfig} saving={saving} />}
        {activeTab === "api" && <ApiTab config={config} saveConfig={saveConfig} saving={saving} />}
    </div>
  );
}
