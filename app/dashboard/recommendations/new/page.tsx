"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { createClient } from "@/lib/supabase";
// import { calculatePricing } from "@/lib/pricing";
const calculatePricing = (a: any, b: any) => ({ total: 0, platformFee: 0, bcPayout: 0, serviceFee: 0 });
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import {
  User,
  FlaskConical,
  AlertTriangle,
  PackageSearch,
  Truck,
  Handshake,
  ShieldCheck,
  Calculator,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  Home,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Send,
  Search,
  MapPin,
  Star,
  Receipt,
  RotateCw,
  Snowflake,
  Minus,
  Trash2,
  Plus,
  Package
} from "lucide-react";
import { useTranslations } from "next-intl";

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // Skip weekends
  }
  return result;
}

// --- Subcomponents ---

function Toggle({ checked, onChange, label }: any) {
  return (
    <div onClick={onChange} className="flex items-center justify-between cursor-pointer">
      {label && <span className="text-[14px] font-medium text-near-black flex-1">{label}</span>}
      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${checked ? 'bg-primary-dark' : 'bg-gray-300'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function Select({ options, value, onChange, placeholder, className = "" }: any) {
  return (
    <select 
      value={value} 
      onChange={onChange}
      className={`w-full px-3.5 py-2.5 rounded-[10px] border border-gray-200 text-[14px] outline-none bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer ${value ? 'text-near-black' : 'text-gray-500'} ${className}`}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label, sublabel }: any) {
  return (
    <label className="flex gap-3 cursor-pointer items-start group">
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
        ${checked ? 'bg-primary border-primary' : 'bg-white border-gray-300 group-hover:border-ruby-400'}`}>
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </div>
      <div>
        <div className="text-[14px] font-medium text-near-black leading-tight">{label}</div>
        {sublabel && <div className="text-[12px] text-gray-500 mt-0.5 leading-snug">{sublabel}</div>}
      </div>
    </label>
  );
}

function RadioOption({ selected, onSelect, label, sublabel, icon: Icon, tag }: any) {
  return (
    <div 
      onClick={onSelect} 
      className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex items-center gap-3 ${
        selected ? 'border-primary bg-open-bg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
        }`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-medium text-near-black leading-tight">{label}</div>
          <div className="flex items-center gap-3">
            {tag && <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">{tag}</span>}
            <div className={`w-[18px] h-[18px] rounded-full border-2 transition-all shrink-0 ${
              selected ? 'border-[5px] border-primary bg-white' : 'border-gray-200 bg-white'
            }`} />
          </div>
        </div>
        {sublabel && (
          <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: any) {
  return (
    <div className="flex items-start gap-3.5 mb-6 pt-2">
      <div className="w-9 h-9 rounded-xl bg-open-bg border border-primary-light/50 flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-primary-dark" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-heading text-[17px] font-medium text-near-black tracking-tight m-0">{title}</h3>
        {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">{subtitle}</p>}
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function NewCasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference Data from Supabase
  const [catalog, setCatalog] = useState<any[]>([]);
  const [platformConfig, setPlatformConfig] = useState<any>({});
  const t = useTranslations('hc.newRecommendation');

  // 1. Patient Data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [guardianName1, setGuardianName1] = useState("");
  const [guardianName2, setGuardianName2] = useState("");

  const [patientFound, setPatientFound] = useState(false);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  // Auto-fill from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      if (urlEmail) {
        setEmail(urlEmail);
        searchPatientByEmail(urlEmail);
      }
    }
  }, []);

  const searchPatientByEmail = async (searchEmail: string) => {
    if (!searchEmail || !searchEmail.includes('@')) {
      setPatientFound(false);
      return;
    }
    
    setIsSearchingPatient(true);
    try {
      const res = await fetch(`/api/dashboard/patients/search?email=${encodeURIComponent(searchEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.patient) {
          const p = data.patient;
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setDob(p.dob || "");
          setGender(p.gender || "");
          setStreet(p.address?.street || "");
          setCity(p.address?.city || "");
          setZip(p.address?.zip || "");
          setPhone(p.phone || "");
          setInsuranceType(p.insuranceType || "");
          if (p.guardianNames) {
            setGuardianName1(p.guardianNames.g1 || "");
            setGuardianName2(p.guardianNames.g2 || "");
          }
          setPatientFound(true);
        } else {
          setPatientFound(false);
        }
      }
    } catch (err) {
      console.error("Error searching patient:", err);
      setPatientFound(false);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const isMinor = (() => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age < 18;
  })();

  // 2. Test Requirements
  const [labGroups, setLabGroups] = useState([{ lab: "", labOther: "", materials: [{ item_id: "", qty: 1, platform_provides: false }], returnLogistics: "hc", pickupLocation: "practice" }]);
  const [mobility, setMobility] = useState("practice");

  // 3. Urgency & Special Flags
  const [urgency, setUrgency] = useState("normal");
  const isPlatformSupplier = labGroups.some(g => g.materials.some(m => m.platform_provides));
  const minPossibleDateStr = format(isPlatformSupplier ? addBusinessDays(new Date(), 3) : new Date(), 'yyyy-MM-dd');

  const [preferredDateFrom, setPreferredDateFrom] = useState(minPossibleDateStr);
  const [preferredDateTo, setPreferredDateTo] = useState(format(addDays(new Date(minPossibleDateStr), 14), 'yyyy-MM-dd'));
  const [specialFlags, setSpecialFlags] = useState({ minor: false, elderly: false, difficult_veins: false });
  const [step, setStep] = useState(0);
  const [mobileFeeExpanded, setMobileFeeExpanded] = useState(false);

  // Auto-reset Urgency
  useEffect(() => {
    if (isPlatformSupplier && urgency !== 'normal') {
      setUrgency('normal');
    }
  }, [isPlatformSupplier, urgency]);

  // React to Urgency changes
  useEffect(() => {
    const minDateObj = new Date(minPossibleDateStr);
    setPreferredDateFrom(minPossibleDateStr);
    if (urgency === 'urgent') setPreferredDateTo(format(addDays(minDateObj, 2), 'yyyy-MM-dd'));
    else if (urgency === 'emergency') setPreferredDateTo(minPossibleDateStr);
    else setPreferredDateTo(format(addDays(minDateObj, 14), 'yyyy-MM-dd'));
  }, [urgency]); // Only trigger on urgency change

  // Enforce bounds if material toggles shift minPossibleDateStr forward
  useEffect(() => {
    if (preferredDateFrom < minPossibleDateStr) {
      setPreferredDateFrom(minPossibleDateStr);
      if (preferredDateTo < minPossibleDateStr) {
        setPreferredDateTo(minPossibleDateStr);
      }
    }
  }, [minPossibleDateStr]);

  const handleEarliestChange = (value: string) => {
    setPreferredDateFrom(value);
    if (preferredDateTo && value > preferredDateTo) {
      setPreferredDateTo(value);
    }
  };

  const handleLatestChange = (value: string) => {
    const newVal = value || minPossibleDateStr;
    setPreferredDateTo(newVal);
    if (newVal < preferredDateFrom) {
      setPreferredDateTo(preferredDateFrom);
    }
  };

  const formSteps = [
    { label: t('steps.patient'), icon: User },
    { label: t('steps.tests'), icon: FlaskConical },
    { label: t('steps.urgency'), icon: AlertTriangle },
    { label: t('steps.shipping'), icon: Truck },
    { label: t('steps.matching'), icon: Handshake },
    { label: t('steps.review'), icon: ShieldCheck }
  ];

  const [returnLogistics, setReturnLogistics] = useState("hc");
  // 5. BC Selection & Invites
  const [bcSelection, setBcSelection] = useState("clinic_shortlist"); // default to middle
  const [invitedBcs, setInvitedBcs] = useState<any[]>([]);
  const [bcSearchQuery, setBcSearchQuery] = useState("");
  const [bcSearchResults, setBcSearchResults] = useState<any[]>([]);
  const [searchingBcs, setSearchingBcs] = useState(false);

  // 7. Consent
  const [therapeutic, setTherapeutic] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      // Fetch active materials via API proxy to bypass RLS
      try {
        const matRes = await fetch('/api/dashboard/materials');
        if (matRes.ok) {
          const matData = await matRes.json();
          if (matData.materials) setCatalog(matData.materials);
        }
      } catch (err) {
        console.error('Failed to load materials catalog:', err);
      }
      
      const { data: cfg } = await supabase.from('platform_config').select('*');
      if (cfg) {
        const pcfg = cfg.reduce((acc: any, row: any) => {
          acc[row.id] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          return acc;
        }, {});
        setPlatformConfig(pcfg);
      }
      
      setLoadingConfig(false);
    }
    fetchConfig();
  }, [supabase]);

  // BC Search Effect
  useEffect(() => {
    const searchBcs = async () => {
      if (!bcSearchQuery || bcSearchQuery.length < 2) {
        setBcSearchResults([]);
        return;
      }
      setSearchingBcs(true);
      
      const { data, error } = await supabase
        .from('blood_collector')
        .select('id, first_name, last_name, qualification, rating, address')
        .eq('status', 'active')
        .or(`first_name.ilike.%${bcSearchQuery}%,last_name.ilike.%${bcSearchQuery}%,address->>city.ilike.%${bcSearchQuery}%`)
        .limit(5);

      if (data && !error) {
        // Filter out already invited BCs
        const filtered = data.filter(bc => !invitedBcs.find(i => i.id === bc.id));
        setBcSearchResults(filtered);
      }
      setSearchingBcs(false);
    };

    const debounce = setTimeout(searchBcs, 300);
    return () => clearTimeout(debounce);
  }, [bcSearchQuery, invitedBcs, supabase]);

  const handleAddInvite = (bc: any) => {
    setInvitedBcs([...invitedBcs, bc]);
    setBcSearchQuery(""); // clear search
  };
  
  const handleRemoveInvite = (id: string) => {
    setInvitedBcs(invitedBcs.filter(b => b.id !== id));
  };

  // Pricing Logic (Refactored)
  const rawMaterialCost = labGroups.reduce((acc, group) => {
    return acc + group.materials.reduce((sum, m) => {
      if (!m.platform_provides) return sum;
      const item = catalog.find(c => c.id === m.item_id);
      return sum + (item ? Number(item.price) * (m.qty || 0) : 0);
    }, 0);
  }, 0);
  
  const hasPlatformMaterials = labGroups.some(g => g.materials.some(m => m.platform_provides));
  const returnLogisticsCount = labGroups.reduce((acc, g) => acc + (g.returnLogistics === "platform" ? 1 : 0), 0);

  // TODO: 99Tests - removed 99Tests dependency
  // const pricing = calculatePricing({
  //   mobility,
  //   urgency,
  //   hasPlatformMaterials: hasPlatformMaterials,
  //   materialCost: rawMaterialCost,
  //   returnLogisticsCount,
  //   platformConfig
  // });
  const pricing: any = { baseFee: 0, travelFee: 0, urgencySurcharge: 0, materialCost: 0, logisticsFee: 0, returnFee: 0, orgFee: 0, subtotal: 0, vat: 0, patientTotal: 0 };

  const {
    baseFee, travelFee, urgencySurcharge, materialCost, logisticsFee, returnFee, orgFee, subtotal, vat, patientTotal
  } = pricing;

  // Interactions
  const handleAddLabGroup = () => setLabGroups([...labGroups, { lab: "", labOther: "", materials: [{ item_id: "", qty: 1, platform_provides: false }], returnLogistics: "hc", pickupLocation: "practice" }]);
  const handleRemoveLabGroup = (idx: number) => setLabGroups(labGroups.filter((_, i) => i !== idx));
  const handleUpdateLabGroup = (idx: number, field: string, val: any) => {
    const lg = [...labGroups];
    (lg[idx] as any)[field] = val;
    setLabGroups(lg);
  };
  const handleAddMaterial = (labIdx: number) => {
    const lg = [...labGroups];
    lg[labIdx].materials.push({ item_id: "", qty: 1, platform_provides: false });
    setLabGroups(lg);
  };
  const handleRemoveMaterial = (labIdx: number, matIdx: number) => {
    const lg = [...labGroups];
    lg[labIdx].materials = lg[labIdx].materials.filter((_, i) => i !== matIdx);
    setLabGroups(lg);
  };
  const handleUpdateMaterial = (labIdx: number, matIdx: number, field: string, val: any) => {
    const lg = [...labGroups];
    (lg[labIdx].materials[matIdx] as any)[field] = val;
    setLabGroups(lg);
  };

  const handleSubmit = async () => {
    if (!therapeutic) {
      setError(t('review.errorConsent'));
      return;
    }
    const hasEmptyLab = labGroups.some(g => !g.lab);
    if (!firstName || !lastName || !dob || hasEmptyLab) {
      setError(t('review.errorValidation'));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authenticated session required.");

      // 2. Map Materials payload
      const mappedMaterials = labGroups.flatMap(g => 
        g.materials.filter(m => m.item_id).map(m => {
          const cat = catalog.find(c => c.id === m.item_id);
          return {
            laboratory: g.lab === 'Other' ? g.labOther : g.lab,
            material_id: m.item_id,
            name: cat?.name,
            qty: m.qty,
            platform_provides: m.platform_provides,
            price_snapshot: cat?.price
          };
        })
      );

      // Determine Application Deadlines
      let windowHours = 48; // Normal
      if (urgency === 'urgent') windowHours = 6;
      if (urgency === 'emergency') windowHours = 2;
      
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + windowHours);

      // 3. Create Recommendation Payload
      const casePayload = {
        id: `BLT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        doctor_id: user.id,
        test_types: [], // Legacy field mapped out via Step 2 Redesign
        preferred_laboratory: labGroups.map(g => g.lab === 'Other' ? g.labOther : g.lab).filter(Boolean).join(', '),
        urgency_level: urgency,
        mobility: mobility === 'home' ? 'home_visit' : 'practice',
        preferred_date_from: preferredDateFrom,
        preferred_date_to: preferredDateTo,
        special_case_flags: {
          minor: specialFlags.minor || isMinor,
          elderly: specialFlags.elderly,
          difficult_veins: specialFlags.difficult_veins
        },
        materials: mappedMaterials,
        material_logistics: mappedMaterials.some(m => m.platform_provides) ? 'platform' : 'hc',
        return_logistics: labGroups.some(g => g.returnLogistics === "platform") ? "platform" : "hc",
        return_pickup_locations: labGroups.map(g => ({ lab: g.lab, pickup_location: g.returnLogistics === "platform" ? g.pickupLocation : null })),
        bc_selection_mode: bcSelection,
        therapeutic_confirmation: therapeutic,
        status: 'created',
        application_window_hours: windowHours,
        application_deadline: deadline.toISOString(),
        invited_bc_ids: invitedBcs.length > 0 ? invitedBcs.map(b => b.id) : null,
        estimated_fees: {
          base_fee: baseFee,
          travel_fee: travelFee,
          urgency_surcharge: urgencySurcharge,
          material_cost: materialCost,
          logistics_fee: logisticsFee,
          return_fee: returnFee,
          total_excl_vat: subtotal,
          vat,
          total_incl_vat: patientTotal,
          doctor_org_fee: orgFee
        }
      };

      // 1-3. Route to Proxy API to bypass RLS
      const res = await fetch('/api/dashboard/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: user.id,
          patientData: {
            firstName,
            lastName,
            dob,
            gender,
            email,
            phone,
            address: { street, city, zip },
            insuranceType,
            guardianNames: isMinor ? { g1: guardianName1, g2: guardianName2 } : null
          },
          casePayload
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit recommendation via proxy");
      }

      // Successfully processed! Route to success confirmation page.
      const result = await res.json();
      router.push(`/dashboard/recommendations/${result.recommendationId}/success`);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const isPracticeMobility = mobility === "practice";
  const hcCostOrgFee = isPracticeMobility ? (platformConfig.fees?.practice_org_fee || 20.00) : (platformConfig.fees?.home_org_fee || 35.00);

  const selectedMaterialsList = labGroups.flatMap(g => g.materials.filter(m => !!m.item_id).map(m => {
        const cat = catalog.find(c => c.id === m.item_id);
        return {
          id: m.item_id,
          name: cat?.name || 'Unknown',
          qty: m.qty || 0,
          price: m.platform_provides ? (cat ? Number(cat.price) : 0) : 0,
          centrifuge: cat?.requires_centrifuge || false,
          refrigeration: cat?.requires_refrigeration || false,
          platform_provides: m.platform_provides
        };
      }));

  const platformProvidedMaterialsList = selectedMaterialsList.filter(m => m.platform_provides);

  const hcCostMaterialSum = platformProvidedMaterialsList.reduce((sum, m) => sum + (m.price * m.qty), 0);
  const hcCostMaterialShipping = hasPlatformMaterials ? 8.50 : 0;
  
  const hcCostReturnCount = labGroups.filter(g => g.returnLogistics === "platform").length;
  const hcCostReturnTotal = hcCostReturnCount * 12.00;

  const hcCostTotalExclVat = hcCostOrgFee + hcCostMaterialSum + hcCostMaterialShipping + hcCostReturnTotal;
  const hcCostVatRate = (platformConfig.tax?.vat_rate_pct || 19) / 100;
  const hcCostVatAmount = hcCostTotalExclVat * hcCostVatRate;
  const hcCostFinalTotal = hcCostTotalExclVat + hcCostVatAmount;

  const hasCentrifuge = selectedMaterialsList.some(m => m.centrifuge);
  const hasRefrigeration = selectedMaterialsList.some(m => m.refrigeration);

  const centrifugeNames = Array.from(new Set(selectedMaterialsList.filter(m => m.centrifuge).map(m => m.name))).join(', ');
  const refrigerationNames = Array.from(new Set(selectedMaterialsList.filter(m => m.refrigeration).map(m => m.name))).join(', ');
  
  const hasSelections = step > 0 || firstName !== "" || labGroups[0].lab !== "";

  return (
    <div className="flex-1 min-w-0 w-full font-body overflow-x-hidden">
      
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <div className="text-[13px] text-gray-500 mb-5 flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-near-black transition-colors">{t('breadcrumb.dashboard')}</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/recommendations" className="hover:text-near-black transition-colors">{t('breadcrumb.recommendations')}</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[13px] font-medium text-near-black">{t('breadcrumb.newRecommendation')}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-near-black transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-heading text-[22px] sm:text-[28px] font-medium text-near-black tracking-tight m-0 leading-none">
              {t('header.title')}
            </h1>
            <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1.5">{t('header.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mt-8 items-start relative">
        
        {/* =========================================
            COLLAPSIBLE MOBILE FEE ESTIMATE
        ========================================= */}
        <div className="xl:hidden w-full bg-white rounded-[16px] border border-gray-200 p-3 sm:p-5 shadow-sm mb-2">
          <div 
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setMobileFeeExpanded(!mobileFeeExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-steel-50 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-steel-600" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{t('estimates.title')}</div>
                <div className="font-heading text-[20px] font-medium text-near-black leading-none">
                  {hasSelections ? `€${hcCostFinalTotal.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              {mobileFeeExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          
          {mobileFeeExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-0 animate-in fade-in slide-in-from-top-2">
              {!hasSelections ? (
                <div className="space-y-0 text-[14px]">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Organization Fee</span>
                    <span className="font-bold text-gray-300">—</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Materials</span>
                    <span className="font-bold text-gray-300">—</span>
                  </div>
                  <div className="pt-3 mt-2 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[16px] font-extrabold text-gray-400">Total</span>
                      <span className="text-[18px] font-heading font-medium text-gray-300 leading-none">—</span>
                    </div>
                  </div>
                  <div className="mt-5 bg-gray-50 border border-gray-100 rounded-lg p-3 text-[12px] text-gray-400 italic flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <div className="leading-snug">Your estimate will update as you complete each step.</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-0 text-[14px]">
                    {/* Organization Fee */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">
                        {isPracticeMobility ? t('estimates.orgFeePractice') : t('estimates.orgFeeHome')}
                      </span>
                      <span className="font-bold text-near-black">€{hcCostOrgFee.toFixed(2)}</span>
                    </div>

                    {/* Materials */}
                    <div className="py-2 border-b border-gray-100 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                         <span className="text-gray-500 font-medium">{t('estimates.materials')}</span>
                        {platformProvidedMaterialsList.length === 0 && <span className="font-bold text-gray-300 text-[13px]">—</span>}
                      </div>
                      {platformProvidedMaterialsList.length > 0 && platformProvidedMaterialsList.map((m, idx) => (
                        <div key={`m-mob-${idx}`} className="flex justify-between items-center ml-4 text-[13px] text-gray-500">
                          <span>{m.name} × {m.qty}</span>
                          <span>€{(m.price * m.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      {hasPlatformMaterials && (
                        <div className="flex justify-between items-center ml-4 mt-0.5 text-[13px] text-gray-500">
                           <span>{t('estimates.materialShipping')} <span className="opacity-70">(&rarr;)</span></span>
                          <span>€8.50</span>
                        </div>
                      )}
                    </div>

                    {/* Return to Lab */}
                    {hcCostReturnCount > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-500 font-medium">{t('estimates.labReturn')}</span>
                        <span className="font-bold text-near-black">€{hcCostReturnTotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Totals */}
                    <div className="pt-3 mt-2 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[13px] text-gray-500 font-medium">{t('estimates.totalExclVat')}</span>
                        <span className="text-[14px] font-bold text-near-black">€{hcCostTotalExclVat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[13px] text-gray-500 font-medium">{t('estimates.vat', { pct: platformConfig.tax?.vat_rate_pct || 19 })}</span>
                        <span className="text-[14px] font-medium text-gray-500">€{hcCostVatAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <span className="text-[16px] font-extrabold text-near-black">{t('estimates.total')}</span>
                        <span className="text-[22px] font-heading font-medium text-near-black leading-none">€{hcCostFinalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[12px] text-gray-500 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div className="leading-snug">{t('estimates.invoiceNotice')}</div>
                  </div>

                  {/* Handling Requirements */}
                  {(hasCentrifuge || hasRefrigeration) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-700 mt-3 flex flex-col gap-1.5">
                       <div className="font-bold mb-0.5">{t('estimates.handlingTitle')}</div>
                      {hasCentrifuge && (
                        <div className="flex items-center gap-1.5">
                           <RotateCw className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">{t('estimates.centrifugeReq')} <span className="opacity-80 font-medium">({centrifugeNames})</span></span>
                        </div>
                      )}
                      {hasRefrigeration && (
                        <div className="flex items-center gap-1.5">
                           <Snowflake className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">{t('estimates.refrigeratedReq')} <span className="opacity-80 font-medium">({refrigerationNames})</span></span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* =========================================
            FORM CONTAINERS 
        ========================================= */}
        <div className="flex-1 flex flex-col min-w-0 w-full gap-5">

          {/* EXACT BC-REGISTRATION PROTOTYPE STEP INDICATOR */}
          <div className="hidden md:flex items-center justify-center gap-0 mb-6">
            {formSteps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  onClick={() => i <= step && setStep(i)}
                  className={`flex items-center gap-2 transition-opacity duration-300 ${i <= step ? "cursor-pointer opacity-100" : "cursor-default opacity-40"}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                    ${i < step ? "bg-primary-dark border-none" : 
                      i === step ? "bg-primary-dark border-2 border-primary-dark" : 
                      "bg-gray-50 border border-gray-200"}`}
                  >
                    {i < step ? (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    ) : (
                      <span className={`text-[14px] font-bold ${i === step ? "text-white" : "text-gray-500"}`}>{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[12px] whitespace-nowrap ${i === step ? "font-bold text-primary-dark" : i < step ? "font-medium text-near-black" : "font-normal text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
                {i < formSteps.length - 1 && (
                  <div className={`w-8 h-[1px] mx-2 transition-colors duration-300 ${i < step ? "bg-primary-dark" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* 1. Patient Info */}
          {step === 0 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
             <SectionHeader icon={User} title={t('patientDetails.sectionTitle')} subtitle={t('patientDetails.sectionSubtitle')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mb-2 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <Label required className="text-sm font-bold text-near-black mb-1.5 flex items-center gap-2">
                   {t('patientDetails.email')}
                   {isSearchingPatient && <span className="text-[11px] font-medium text-gray-500 animate-pulse">{t('patientDetails.searching')}</span>}
                </Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  onBlur={() => searchPatientByEmail(email)}
                   placeholder={t('patientDetails.emailPlaceholder')} 
                  className="bg-white text-[15px] font-medium placeholder:font-normal py-3 px-4 shadow-sm"
                />
                 <div className="text-[12px] text-gray-500 mt-2 ml-1">{t('patientDetails.emailHelpText')}</div>
                
                {patientFound && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 text-[13px] text-emerald-800 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                     <strong>{t('patientDetails.patientFound')}</strong> {t('patientDetails.patientFoundDesc')}
                  </div>
                )}
              </div>

              <div>
                 <Label required>{t('patientDetails.firstName')}</Label>
                 <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('patientDetails.firstNamePlaceholder')} />
              </div>
              <div>
                 <Label required>{t('patientDetails.lastName')}</Label>
                 <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('patientDetails.lastNamePlaceholder')} />
              </div>
              <div>
                 <Label required>{t('patientDetails.dob')}</Label>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div>
                 <Label required>{t('patientDetails.gender')}</Label>
                 <Select value={gender} onChange={(e: any) => setGender(e.target.value)} options={[t('patientDetails.genderOptions.male'), t('patientDetails.genderOptions.female'), t('patientDetails.genderOptions.diverse')]} placeholder={t('patientDetails.genderPlaceholder')} />
              </div>
              <div className="md:col-span-2">
                 <Label required>{t('patientDetails.address')}</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                   <Input className="flex-1" value={street} onChange={e => setStreet(e.target.value)} placeholder={t('patientDetails.street')} />
                   <Input className="w-full sm:w-28" value={zip} onChange={e => setZip(e.target.value)} placeholder={t('patientDetails.zip')} />
                   <Input className="flex-1" value={city} onChange={e => setCity(e.target.value)} placeholder={t('patientDetails.city')} />
                </div>
              </div>
              <div>
                 <Label required>{t('patientDetails.phone')}</Label>
                 <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('patientDetails.phonePlaceholder')} />
              </div>
              <div>
                 <Label>{t('patientDetails.insurance')}</Label>
                 <Input value={insuranceType} onChange={e => setInsuranceType(e.target.value)} placeholder={t('patientDetails.insurancePlaceholder')} />
              </div>
            </div>

            {/* Minor auto-detection */}
            {isMinor && (
              <div className="mt-5 p-5 rounded-[12px] bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-[18px] h-[18px] text-amber-700" />
                   <span className="text-[14px] font-bold text-amber-800">{t('patientDetails.minorWarning')}</span>
                </div>
                 <p className="text-[13px] text-amber-700/80 mb-4">{t('patientDetails.minorWarningDesc')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <Label required>{t('patientDetails.guardian1')}</Label>
                     <Input value={guardianName1} onChange={e => setGuardianName1(e.target.value)} placeholder={t('patientDetails.guardian1Placeholder')} />
                  </div>
                  <div>
                     <Label>{t('patientDetails.guardian2')} <span className="text-gray-500 font-normal">{t('patientDetails.optional')}</span></Label>
                     <Input value={guardianName2} onChange={e => setGuardianName2(e.target.value)} placeholder={t('patientDetails.guardian2Placeholder')} />
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* 2. Test Requirements (Lab Groups) */}
          {step === 1 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-start justify-between mb-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-open-bg border border-primary-light/50 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-[18px] h-[18px] text-primary-dark" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading text-[17px] font-medium text-near-black tracking-tight m-0">{t('testRequirements.sectionTitle')}</h3>
                  <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('testRequirements.sectionSubtitle')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 mt-4">
              {labGroups.map((lg, idx) => {
                const labMaterialsItems = lg.materials.map(m => catalog.find(c => c.id === m.item_id)).filter(Boolean);
                const hasCentrifuge = labMaterialsItems.some(c => c.requires_centrifuge);
                const hasRefrigeration = labMaterialsItems.some(c => c.requires_refrigeration);
                const centrifugeNames = labMaterialsItems.filter(c => c.requires_centrifuge).map(c => c.name).join(", ");
                const refrigerationNames = labMaterialsItems.filter(c => c.requires_refrigeration).map(c => c.name).join(", ");

                return (
                <div key={idx} className="p-5 sm:p-6 rounded-[12px] border border-gray-200 bg-white relative shadow-sm">
                  {labGroups.length > 1 && (
                    <button 
                      onClick={() => handleRemoveLabGroup(idx)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors text-[20px] leading-none"
                      title={t('testRequirements.removeLab')}
                    >
                      &times;
                    </button>
                  )}
                  
                  <div className="mb-4">
                    <Label required>{t('testRequirements.laboratoryLabel')} {labGroups.length > 1 ? idx + 1 : ""}</Label>
                    <Select 
                      value={lg.lab} 
                      onChange={(e: any) => handleUpdateLabGroup(idx, "lab", e.target.value)} 
                      options={["Labor Berlin", "Synlab", "Sonic Healthcare", "MVZ Labor Augsburg", "IMD Berlin", "Other"]} 
                      placeholder={t('testRequirements.selectLab')} 
                    />
                    {lg.lab === "Other" && (
                      <div className="mt-3">
                        <Input 
                          value={lg.labOther} 
                          onChange={(e: any) => handleUpdateLabGroup(idx, "labOther", e.target.value)} 
                          placeholder={t('testRequirements.otherLabPlaceholder')} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <h4 className="text-[14px] font-medium text-near-black mb-3">{t('testRequirements.tubesTitle')}</h4>
                    {loadingConfig ? (
                       <div className="text-sm text-gray-500 animate-pulse">{t('testRequirements.loading')}</div>
                    ) : (
                       <>
                         <div className="flex flex-col">
                           {lg.materials.map((m, matIdx) => {
                             const selectedMaterialIds = lg.materials
                               .filter((_, i) => i !== matIdx)
                               .map(mat => mat.item_id)
                               .filter(Boolean);
                             const availableMaterials = catalog.filter(c => !selectedMaterialIds.includes(c.id));

                             return (
                             <div key={matIdx} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100/60 shadow-sm transition-all">
                               {/* Row 1: Dropdown & Stepper */}
                               <div className="flex items-start sm:items-center gap-3 w-full">
                                 {/* Dropdown Container */}
                                 <div className="relative flex-1">
                                    <select 
                                      value={m.item_id} 
                                      onChange={e => handleUpdateMaterial(idx, matIdx, "item_id", e.target.value)}
                                      className="w-full appearance-none rounded-full border border-gray-200 px-4 py-2.5 pr-10 text-[14px] bg-white text-near-black outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                                    >
                                      <option value="" disabled>{t('testRequirements.selectTube')}</option>
                                      {availableMaterials.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </div>
                                 </div>
                                 
                                 {/* Quantity Stepper */}
                                 <div className="flex items-center gap-1 self-start sm:self-auto bg-white rounded-full border border-gray-200 p-1 shadow-sm shrink-0">
                                   <button 
                                     onClick={() => handleUpdateMaterial(idx, matIdx, "qty", Math.max(1, (m.qty || 1) - 1))}
                                     className="w-8 h-8 rounded-full border border-transparent flex items-center justify-center text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-near-black transition-colors shrink-0"
                                   >
                                     <Minus className="w-4 h-4" />
                                   </button>
                                   <div className="w-8 text-center text-[14px] font-medium text-near-black leading-none">{m.qty}</div>
                                   <button 
                                     onClick={() => handleUpdateMaterial(idx, matIdx, "qty", (m.qty || 1) + 1)}
                                     className="w-8 h-8 rounded-full border border-transparent flex items-center justify-center text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-near-black transition-colors shrink-0"
                                   >
                                     <Plus className="w-4 h-4" />
                                   </button>
                                 </div>
                               </div>

                               {/* Row 2: Badges (Rendered below dropdown) */}
                               {m.item_id && (() => {
                                   const cat = catalog.find(c => c.id === m.item_id);
                                   if (!cat) return null;
                                   if (!cat.requires_centrifuge && !cat.requires_refrigeration) return null;

                                   return (
                                      <div className="flex gap-2 mt-2 w-full pl-1">
                                         {cat.requires_centrifuge && <span className="text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-medium"><RotateCw className="w-3 h-3" /> {t('testRequirements.centrifugeBadge')}</span>}
                                         {cat.requires_refrigeration && <span className="text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 font-medium"><Snowflake className="w-3 h-3" /> {t('testRequirements.refrigeratedBadge')}</span>}
                                      </div>
                                   );
                               })()}

                               {/* Row 3: Checkbox, Unit Price, Remove */}
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mt-3 pt-3 border-t border-gray-200/60 w-full">
                                 <div className="flex items-center gap-3">
                                   <label className="flex items-center gap-2 cursor-pointer group">
                                     <input 
                                       type="checkbox" 
                                       checked={m.platform_provides}
                                       onChange={e => handleUpdateMaterial(idx, matIdx, "platform_provides", e.target.checked)}
                                       className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                                     />
                                     <span className="text-[13px] text-gray-500 group-hover:text-near-black transition-colors">{t('testRequirements.supplyVia99Tests')}</span>
                                   </label>
                                   {m.item_id && (
                                     <span className="text-[13px] text-gray-400 font-medium hidden sm:inline-block border-l border-gray-300 pl-3">
                                       €{catalog.find(c => c.id === m.item_id)?.price.toFixed(2)}/unit
                                     </span>
                                   )}
                                 </div>
                                 
                                 <button 
                                   onClick={() => handleRemoveMaterial(idx, matIdx)}
                                   disabled={lg.materials.length <= 1}
                                   className={`flex items-center gap-1.5 text-[13px] font-medium self-end sm:self-auto ${lg.materials.length <= 1 ? 'opacity-30 cursor-not-allowed text-gray-400' : 'text-gray-400 hover:text-red-500 cursor-pointer transition-colors'}`}
                                 >
                                   <Trash2 className="w-4 h-4 shrink-0" /> {t('testRequirements.removeMat')}
                                 </button>
                               </div>
                             </div>
                           )})}
                         </div>
                         
                         <div className="flex justify-start">
                           <button 
                             onClick={() => handleAddMaterial(idx)}
                             className="mt-1 text-primary text-[14px] font-medium flex items-center gap-1.5 cursor-pointer hover:text-primary-dark transition-colors w-max"
                           >
                             <Plus className="w-4 h-4" /> {t('testRequirements.addTube')}
                           </button>
                         </div>

                         {/* Handling Requirements */}
                         {(hasCentrifuge || hasRefrigeration) && (
                           <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-700 mt-5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                             <div className="font-bold mb-0.5">⚠️ {t('estimates.handlingTitle')}</div>
                             {hasCentrifuge && (
                               <div className="flex items-center gap-1.5">
                                 <RotateCw className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">{t('estimates.centrifugeReq')} <span className="opacity-80 font-medium">({centrifugeNames})</span></span>
                               </div>
                             )}
                             {hasRefrigeration && (
                               <div className="flex items-center gap-1.5">
                                 <Snowflake className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">{t('estimates.refrigeratedReq')} <span className="opacity-80 font-medium">({refrigerationNames})</span></span>
                               </div>
                             )}
                           </div>
                         )}
                       </>
                    )}
                  </div>
                </div>
              )})}

              <button 
                onClick={handleAddLabGroup}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-ruby-400 hover:bg-open-bg/50 text-[14px] font-bold text-gray-500 hover:text-primary-dark flex items-center justify-center gap-2 transition-all mt-1"
              >
                <Plus className="w-4 h-4" /> {t('testRequirements.addLab')}
              </button>

              {hasPlatformMaterials && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-700 flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="leading-snug">{t('testRequirements.shippingNotice')}</span>
                </div>
              )}

              <div className="mt-4 pt-5 border-t border-gray-200">
                <Label required>{t('testRequirements.mobilityLabel')}</Label>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <div className="flex-1">
                    <RadioOption 
                      selected={mobility === "practice"} 
                      onSelect={() => setMobility("practice")} 
                      label={t('testRequirements.practice')} 
                      icon={Building2} 
                    />
                  </div>
                  <div className="flex-1">
                    <RadioOption 
                      selected={mobility === "home"} 
                      onSelect={() => setMobility("home")} 
                      label={t('testRequirements.homeVisit')} 
                      icon={Home} 
                      tag={t('testRequirements.travelFeeBadge')} 
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
          )}

          {/* 3. Urgency & Special Recommendations */}
          {step === 2 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader icon={AlertTriangle} title={t('urgencySpecial.sectionTitle')} subtitle={t('urgencySpecial.sectionSubtitle')} />
            
            <Label required>{t('urgencySpecial.urgencyLabel')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { 
                  val: "normal", label: t('urgencySpecial.normal'), sub: t('urgencySpecial.normalDesc'), surcharge: null, 
                  selectedClasses: "border-primary bg-open-bg", titleClass: "text-near-black", subClass: "text-gray-500",
                  badgeClass: null 
                },
                { 
                  val: "urgent", label: t('urgencySpecial.urgent'), sub: t('urgencySpecial.urgentDesc'), surcharge: "+25%", 
                  selectedClasses: "border-[#D97706] bg-[#FFF7ED]", titleClass: "text-[#D97706]", subClass: "text-gray-500",
                  badgeClass: "bg-[#D97706]/10 text-[#D97706]"
                },
                { 
                  val: "emergency", label: t('urgencySpecial.emergency'), sub: t('urgencySpecial.emergencyDesc'), surcharge: "+50%", 
                  selectedClasses: "border-red-600 bg-red-600", titleClass: "text-white", subClass: "text-white/80",
                  badgeClass: "bg-white/20 text-white"
                },
              ].map(u => {
                const isDisabled = isPlatformSupplier && u.val !== "normal";

                return (
                <div 
                  key={u.val} 
                  onClick={() => !isDisabled && setUrgency(u.val)} 
                  className={isDisabled 
                    ? "border-2 border-gray-200 bg-gray-50 rounded-xl p-4 cursor-not-allowed opacity-60 text-center"
                    : `p-4 rounded-xl cursor-pointer text-center border-2 transition-all ${
                        urgency === u.val ? u.selectedClasses : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`
                  }
                >
                  <div className={`text-[15px] font-medium ${isDisabled ? 'text-gray-400' : (urgency === u.val ? u.titleClass : 'text-near-black')}`}>{u.label}</div>
                  <div className={`text-[12px] mt-0.5 ${isDisabled ? 'text-gray-300' : (urgency === u.val ? u.subClass : 'text-gray-500')}`}>{u.sub}</div>
                  {u.surcharge && (
                    <div className={`mt-2.5 inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isDisabled ? 'bg-gray-100 text-gray-400' : (urgency === u.val ? u.badgeClass : 'bg-gray-100 text-gray-500')
                    }`}>
                      {u.surcharge}
                    </div>
                  )}
                </div>
              )})}
            </div>

            {isPlatformSupplier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-700 flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 shrink-0" />
                <span className="leading-snug">{t('urgencySpecial.materialBlockNotice')}</span>
              </div>
            )}

            <div className="mt-8 mb-6 p-5 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-4">
              <h4 className="text-[14px] font-medium text-near-black m-0">{t('urgencySpecial.timeframeTitle')}</h4>
              <p className="text-[12px] text-gray-500 mt-0 mb-1 leading-snug">
                {t('urgencySpecial.timeframeDesc')}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>{t('urgencySpecial.earliest')}</Label>
                  <Input 
                    type="date" 
                    min={minPossibleDateStr}
                    value={preferredDateFrom} 
                    onChange={e => handleEarliestChange(e.target.value)} 
                  />
                </div>
                <div className="flex-1">
                  <Label>{t('urgencySpecial.latest')}</Label>
                  <Input 
                    type="date" 
                    min={preferredDateFrom || minPossibleDateStr}
                    value={preferredDateTo} 
                    onChange={e => handleLatestChange(e.target.value)} 
                  />
                </div>
              </div>

              {isPlatformSupplier && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-700 flex items-center gap-2 mt-3">
                  <Package className="w-5 h-5 shrink-0" />
                  <span className="leading-snug">{t('urgencySpecial.timeframeBlockNotice')}</span>
                </div>
              )}
            </div>

            <Label>{t('urgencySpecial.flagsLabel')}</Label>
            <div className="flex flex-col gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200 mt-2">
              <Checkbox 
                checked={specialFlags.minor || isMinor} 
                onChange={() => {
                  if (!isMinor) {
                    setSpecialFlags({ 
                      ...specialFlags, 
                      minor: !specialFlags.minor, 
                      elderly: !specialFlags.minor ? false : specialFlags.elderly 
                    });
                  }
                }} 
                label={t('urgencySpecial.minorFlag')} 
                sublabel={isMinor ? t('urgencySpecial.minorFlagAuto') : t('urgencySpecial.minorFlagManual')} 
              />
              <Checkbox 
                checked={specialFlags.elderly && !isMinor} 
                onChange={() => {
                  if (!isMinor) {
                    setSpecialFlags({ 
                      ...specialFlags, 
                      elderly: !specialFlags.elderly, 
                      minor: !specialFlags.elderly ? false : specialFlags.minor 
                    });
                  }
                }} 
                label={t('urgencySpecial.elderlyFlag')} 
                sublabel={isMinor ? t('urgencySpecial.elderlyFlagBlock') : t('urgencySpecial.elderlyFlagManual')} 
              />
              <Checkbox 
                checked={specialFlags.difficult_veins} 
                onChange={() => setSpecialFlags({ ...specialFlags, difficult_veins: !specialFlags.difficult_veins })} 
                label={t('urgencySpecial.veinsFlag')} 
                sublabel={t('urgencySpecial.veinsFlagDesc')} 
              />
            </div>
          </div>
          )}

          {/* 4. Logistics */}
          {step === 3 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader icon={Truck} title={t('shipping.sectionTitle')} subtitle={t('shipping.sectionSubtitle')} />
            <div className="mt-4">
              <div className="flex flex-col gap-4 mt-2">
                  {labGroups.map((g, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                      <span className="text-[13px] font-bold text-near-black mb-2 block">{g.lab === 'Other' ? g.labOther : (g.lab || `${t('testRequirements.laboratoryLabel')} ${idx + 1}`)}</span>
                      <div className="flex flex-col gap-2.5">
                        <RadioOption selected={g.returnLogistics === "hc"} onSelect={() => handleUpdateLabGroup(idx, "returnLogistics", "hc")} label={t('shipping.hcOrganizes')} sublabel={t('shipping.hcOrganizesDesc')} icon={Building2} />
                        {g.lab !== "Other" ? (
                          <RadioOption selected={g.returnLogistics === "platform"} onSelect={() => handleUpdateLabGroup(idx, "returnLogistics", "platform")} label={t('shipping.platformOrganizes')} sublabel={t('shipping.platformOrganizesDesc')} icon={Truck} tag="+€12.00" />
                        ) : (
                          <div className="opacity-50 cursor-not-allowed">
                            <RadioOption selected={false} onSelect={() => {}} label={t('shipping.platformOrganizes')} sublabel={t('shipping.platformUnavailable')} icon={Truck} tag="+€12.00" />
                          </div>
                        )}
                        
                        {g.returnLogistics === "platform" && (
                          <div className="ml-6 mt-3 animate-in fade-in slide-in-from-top-2">
                            <div className="text-[13px] font-bold text-near-black mb-2">{t('shipping.pickupLocation')}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div 
                                onClick={() => handleUpdateLabGroup(idx, "pickupLocation", "practice")}
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between gap-3 ${g.pickupLocation === "practice" ? "border-primary bg-open-bg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${g.pickupLocation === "practice" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                                    <Building2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-medium text-near-black leading-tight">{t('shipping.practiceOffice')}</div>
                                    <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('shipping.practiceOfficeDesc')}</div>
                                  </div>
                                </div>
                                <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-all ${g.pickupLocation === "practice" ? "border-[5px] border-primary bg-white" : "border-gray-200 bg-white"}`} />
                              </div>

                              <div 
                                onClick={() => handleUpdateLabGroup(idx, "pickupLocation", "patient_home")}
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between gap-3 ${g.pickupLocation === "patient_home" ? "border-primary bg-open-bg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${g.pickupLocation === "patient_home" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                                    <Home className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-medium text-near-black leading-tight">{t('shipping.patientHome')}</div>
                                    <div className="text-[13px] text-gray-500 mt-0.5 leading-snug">{t('shipping.patientHomeDesc')}</div>
                                  </div>
                                </div>
                                <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-all ${g.pickupLocation === "patient_home" ? "border-[5px] border-primary bg-white" : "border-gray-200 bg-white"}`} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
          )}


          {/* 6. BC Selection Mode */}
          {step === 4 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader icon={Handshake} title={t('matching.sectionTitle')} subtitle={t('matching.sectionSubtitle')} />
            <div className="flex flex-col gap-3 mb-8">
              <RadioOption 
                selected={bcSelection === "patient_decides"} 
                onSelect={() => setBcSelection("patient_decides")} 
                label={t('matching.patientDecides')} 
                sublabel={t('matching.patientDecidesDesc')} 
              />
              <RadioOption 
                selected={bcSelection === "clinic_shortlist"} 
                onSelect={() => setBcSelection("clinic_shortlist")} 
                label={t('matching.clinicShortlist')} 
                sublabel={t('matching.clinicShortlistDesc')} 
              />
              <RadioOption 
                selected={bcSelection === "clinic_approval"} 
                onSelect={() => setBcSelection("clinic_approval")} 
                label={t('matching.clinicApproval')} 
                sublabel={t('matching.clinicApprovalDesc')} 
              />
            </div>

            {/* TODO: Invite Specific Collectors — hidden until feature is redesigned */}
            {false && (
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
                  <User className="w-[18px] h-[18px] text-indigo-600" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading text-[17px] font-medium text-near-black tracking-tight m-0">Invite Specific Collectors (Optional)</h3>
                  <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                    These collectors will receive a priority invitation. All other qualified collectors in the area will also be notified.
                  </p>
                </div>
              </div>

              <div className="mt-5 relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="Search collectors by name or city..." 
                    value={bcSearchQuery}
                    onChange={(e: any) => setBcSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchingBcs && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate/30 border-t-slate animate-spin" />
                  )}
                </div>

                {bcSearchResults.length > 0 && bcSearchQuery.length >= 2 && (
                  <div className="absolute z-20 top-[110%] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                    {bcSearchResults.map(bc => (
                      <div 
                        key={bc.id}
                        onClick={() => handleAddInvite(bc)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 font-bold text-indigo-700 flex items-center justify-center text-[12px]">
                            {bc.first_name[0]}{bc.last_name[0]}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-near-black">{bc.first_name} {bc.last_name}</div>
                            <div className="text-[12px] text-gray-500 flex items-center gap-2">
                              <span>{bc.qualification}</span>
                              {bc.address?.city && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {bc.address.city}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-0.5 justify-end">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-[13px] font-bold text-near-black">{bc.rating?.toFixed(1) || '5.0'}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Invite</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {bcSearchResults.length === 0 && bcSearchQuery.length >= 2 && !searchingBcs && (
                   <div className="absolute z-20 top-[110%] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-xl p-4 text-center text-[13px] text-gray-500">
                     No active collectors found matching "{bcSearchQuery}".
                   </div>
                )}
              </div>

              {invitedBcs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {invitedBcs.map(bc => (
                    <div key={bc.id} className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-[13px] font-medium">
                      <span>{bc.first_name} {bc.last_name}</span>
                      <button 
                        onClick={() => handleRemoveInvite(bc.id)}
                        className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center hover:bg-indigo-300 transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          )}

          {/* 7. Confirmation & Submission */}
          {step === 5 && (
          <div className="bg-white rounded-[16px] border border-gray-200 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader icon={ShieldCheck} title={t('review.sectionTitle')} subtitle={t('review.sectionSubtitle')} />
            
            <div className={`p-5 rounded-[12px] border transition-colors mb-6 ${
              therapeutic ? 'bg-open-bg/50 border-primary-light' : 'bg-amber-50 border-amber-200'
            }`}>
              <Checkbox 
                checked={therapeutic} 
                onChange={() => setTherapeutic(!therapeutic)} 
                label={t('review.checkbox')} 
                sublabel={t('review.checkboxDesc')} 
              />
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 text-[13px] font-medium rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </div>
          )}

          {/* STEP CONTROLS */}
          <div className="flex items-center justify-between mt-2 mb-6 md:mb-0">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] transition-all border
                ${step === 0 || submitting ? "opacity-30 cursor-default border-gray-200 text-gray-500" : "border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 hover:text-near-black cursor-pointer"}`}
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" /> {t('controls.previous')}
            </button>

            <div className="text-[13px] text-gray-500 font-medium md:hidden">{t('steps.stepIndicator', { step: step + 1 })}</div>

            {step < 5 ? (
              <button 
                onClick={() => setStep(s => Math.min(5, s + 1))} 
                className="px-6 py-3 rounded-full shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] text-[14px] font-semibold flex items-center gap-2 border-none bg-primary text-white cursor-pointer hover:bg-primary-dark transition-all hover:-translate-y-[1px]"
              >
                {t('controls.continue')} <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button 
                disabled={!therapeutic || submitting}
                onClick={handleSubmit}
                className={`px-8 py-3 rounded-full text-[14px] font-semibold flex items-center gap-2 border-none text-white transition-all
                  ${therapeutic && !submitting ? 'bg-primary hover:bg-primary-dark cursor-pointer shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px]' : 'bg-ruby-400 opacity-70 cursor-not-allowed shadow-none'}`}
              >
                {submitting ? t('controls.processing') : (
                  <>{t('controls.submit')} <Send className="w-4 h-4 ml-1 text-white" /></>
                )}
              </button>
            )}
          </div>
        </div>

           {/* =========================================
            STICKY FEE PANEL (DESKTOP)
        ========================================= */}
        <div className="hidden xl:block w-[360px] shrink-0 sticky top-24">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4">
            <h3 className="font-heading text-[18px] font-medium flex items-center gap-2.5 m-0 mb-5">
              <span className="w-8 h-8 rounded-lg bg-steel-50 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-steel-600" />
              </span>
              Your Cost Estimate
            </h3>

            {!hasSelections ? (
              <div className="space-y-0 text-[14px]">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-400 font-medium">Organization Fee</span>
                  <span className="font-bold text-gray-300">—</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-400 font-medium">Materials</span>
                  <span className="font-bold text-gray-300">—</span>
                </div>
                <div className="pt-3 mt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[16px] font-extrabold text-gray-400">Total</span>
                    <span className="text-[18px] font-heading font-medium text-gray-300 leading-none">—</span>
                  </div>
                </div>
                <div className="mt-5 bg-gray-50 border border-gray-100 rounded-lg p-3 text-[12px] text-gray-400 italic flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div className="leading-snug">Your estimate will update as you complete each step.</div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-0 text-[14px]">
                  {/* Organization Fee */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">
                      {isPracticeMobility ? "Organization Fee (Practice)" : "Organization Fee (Home Visit)"}
                    </span>
                    <span className="font-bold text-near-black">€{hcCostOrgFee.toFixed(2)}</span>
                  </div>

                  {/* Materials */}
                  <div className="py-2 border-b border-gray-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Materials</span>
                      {platformProvidedMaterialsList.length === 0 && <span className="font-bold text-gray-300 text-[13px]">—</span>}
                    </div>
                    {platformProvidedMaterialsList.length > 0 && platformProvidedMaterialsList.map((m, i) => (
                      <div key={`m-${i}`} className="flex justify-between items-center ml-4 text-[13px] text-gray-500">
                        <span>{m.name} × {m.qty}</span>
                        <span>€{(m.price * m.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    {hasPlatformMaterials && (
                      <div className="flex justify-between items-center ml-4 mt-0.5 text-[13px] text-gray-500">
                        <span>Material Shipping <span className="opacity-70">(&rarr;)</span></span>
                        <span>€8.50</span>
                      </div>
                    )}
                  </div>

                  {/* Return to Lab */}
                  {hcCostReturnCount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Lab Return</span>
                      <span className="font-bold text-near-black">€{hcCostReturnTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="pt-3 mt-2 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] text-gray-500 font-medium">Total (excl. VAT)</span>
                      <span className="text-[14px] font-bold text-near-black">€{hcCostTotalExclVat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[13px] text-gray-500 font-medium">VAT ({platformConfig.tax?.vat_rate_pct || 19}%)</span>
                      <span className="text-[14px] font-medium text-gray-500">€{hcCostVatAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[16px] font-extrabold text-near-black">Total</span>
                      <span className="text-[22px] font-heading font-medium text-near-black leading-none">€{hcCostFinalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[12px] text-gray-500 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">This amount will be added to your monthly invoice.</div>
                </div>

                {/* Handling Requirements */}
                {(hasCentrifuge || hasRefrigeration) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-700 mt-3 flex flex-col gap-1.5">
                    <div className="font-bold mb-0.5">Handling Requirements:</div>
                    {hasCentrifuge && (
                      <div className="flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">Centrifuge required <span className="opacity-80 font-medium">({centrifugeNames})</span></span>
                      </div>
                    )}
                    {hasRefrigeration && (
                      <div className="flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5 shrink-0" /> <span className="flex-1 leading-snug">Refrigeration required <span className="opacity-80 font-medium">({refrigerationNames})</span></span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

