"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";
import { 
  CheckCircle2, 
  Search, 
  MapPin, 
  Star, 
  FileText, 
  Building2, 
  CalendarDays, 
  PlusCircle, 
  MinusCircle,
  Check,
  Verified,
  Send
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function MatchingShortlistClient({ caseInfo, initialCollectors }: { caseInfo: any, initialCollectors: any[] }) {
  const [collectors, setCollectors] = useState(initialCollectors);
  const [sortBy, setSortBy] = useState("recommended");
  const [approved, setApproved] = useState<Set<string>>(
    new Set(initialCollectors.filter(c => c.status === 'accepted').map(c => c.id))
  );
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations('hc.matching.client');
  const tCaseDetail = useTranslations('hc.caseDetail.breadcrumb');
  
  const [filterExp, setFilterExp] = useState({ minor: false, elderly: false, difficult_veins: false });
  const [filterEquip, setFilterEquip] = useState({ centrifuge: false, freezer: false });

  const supabase = createClient();

  const toggleApprove = (id: string) => {
    const next = new Set(approved);
    if (next.has(id)) next.delete(id); else next.add(id);
    setApproved(next);
  };

  const handleSendShortlist = async () => {
    setIsSending(true);
    
    // 1. Get the app_ids that correspond to the approved BCs
    const approvedAppIds = initialCollectors
      .filter(c => approved.has(c.id))
      .map(c => c.app_id);

    try {
      // 2. Update status of approved applications
      if (approvedAppIds.length > 0) {
        await supabase
          .from("case_application")
          .update({ status: "accepted" })
          .in("id", approvedAppIds);
      }

      // 3. Update status of declined applications
      const declinedAppIds = initialCollectors
        .filter(c => !approved.has(c.id))
        .map(c => c.app_id);
        
      if (declinedAppIds.length > 0) {
        await supabase
          .from("case_application")
          .update({ status: "rejected" })
          .in("id", declinedAppIds);
      }

      // 4. Notify Patient
      await fetch('/api/internal/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify_patient_shortlist',
          payload: { recommendationId: caseInfo.id }
        })
      });

      setSent(true);
    } catch (err) {
      console.error("Failed to send shortlist:", err);
      alert("Failed to send shortlist. Check console.");
    } finally {
      setIsSending(false);
    }
  };

  let filtered = [...collectors];
  if (filterExp.minor) filtered = filtered.filter(c => c.expMinor);
  if (filterExp.elderly) filtered = filtered.filter(c => c.expElderly);
  if (filterExp.difficult_veins) filtered = filtered.filter(c => c.expDifficultVeins);
  if (filterEquip.centrifuge) filtered = filtered.filter(c => c.hasCentrifuge);
  if (filterEquip.freezer) filtered = filtered.filter(c => c.hasFreezer);

  if (sortBy === "distance") filtered.sort((a, b) => a.distance - b.distance);
  else if (sortBy === "price") filtered.sort((a, b) => a.totalFee - b.totalFee);
  else if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "experience") filtered.sort((a, b) => b.collections - a.collections);
  else filtered.sort((a, b) => (b.bestMatch ? 1 : 0) - (a.bestMatch ? 1 : 0) || a.distance - b.distance);

  const approvedList = collectors.filter(c => approved.has(c.id));

  return (
    <div className="flex-1 min-w-0 w-full min-h-screen relative pb-32">
      {/* Breadcrumb */}
      <div className="text-[13px] text-gray-500 mb-2 flex items-center gap-2">
        <a href="/dashboard" className="hover:text-near-black transition-colors">{tCaseDetail('dashboard')}</a> ›
        <a href="/dashboard/recommendations" className="hover:text-near-black transition-colors">{tCaseDetail('recommendations')}</a> ›
        <span className="font-medium text-near-black">{t('breadcrumbApprove')}</span>
      </div>

      <div className="mb-7">
        <h1 className="font-heading text-3xl font-medium tracking-tight mb-1 text-near-black">
          {t('title')}
        </h1>
        <p className="text-[14px] text-gray-500 m-0">
          {t('desc')}
        </p>
      </div>

      {new Date(caseInfo.deadline).getTime() > Date.now() && !sent && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl p-4 mb-6 flex items-start gap-4 shadow-sm">
          <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[14px] mb-1">{t('acceptingBannerTitle', { hours: Math.ceil((new Date(caseInfo.deadline).getTime() - Date.now()) / (1000 * 60 * 60)) })}</div>
            <div className="text-[13px] text-indigo-700/80">{t('acceptingBannerDesc', { count: filtered.length })}</div>
          </div>
        </div>
      )}

      {/* How it works banner */}
      {!sent && (
        <div className="bg-steel-50/50 rounded-[14px] p-4 mb-6 flex items-center gap-6">
          {[
            { num: "1", text: t('steps.step1'), active: true },
            { num: "2", text: t('steps.step2'), active: false },
            { num: "3", text: t('steps.step3'), active: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.active ? 'bg-primary-dark text-white' : 'bg-steel-100 text-steel-600'}`}>
                <span className="text-[12px] font-bold">{s.num}</span>
              </div>
              <span className={`text-[13px] ${s.active ? 'font-semibold text-near-black' : 'font-medium text-gray-500'}`}>{s.text}</span>
              {i < 2 && <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-gray-200" />}
            </div>
          ))}
        </div>
      )}

      {/* Sent confirmation */}
      {sent && (
        <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-[16px] p-8 text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="font-heading text-xl font-medium mb-2 text-near-black">{t('sent.title', { patient: caseInfo.patient })}</div>
          <p className="text-[14px] text-gray-500 mb-4 max-w-md mx-auto leading-relaxed">
            {t('sent.desc', { count: approvedList.length })}
          </p>
          <div className="flex justify-center -space-x-2">
            {approvedList.map(bc => (
              <img key={bc.id} src={bc.photo} alt={bc.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ))}
          </div>
        </div>
      )}

      {!sent && (
        <>
          {/* Recommendation Summary */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-4 px-6 mb-6 flex flex-wrap gap-x-8 gap-y-4 items-center shadow-sm">
            {[
              { label: t('summary.patient'), value: caseInfo.patient },
              { label: t('summary.test'), value: caseInfo.test },
              { label: t('summary.urgency'), value: caseInfo.urgency, highlight: true },
              { label: t('summary.type'), value: caseInfo.type },
              { label: t('summary.location'), value: caseInfo.address },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] text-gray-500 font-medium mb-0.5">{item.label}</div>
                  <div className={`text-[13px] font-semibold ${item.highlight ? 'text-amber-600' : 'text-near-black'}`}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sort + Filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] text-gray-500 font-medium mr-1.5">{t('sort.label')}</span>
              {["recommended", "distance", "price", "rating", "experience"].map(s => (
                <button 
                  key={s} 
                  onClick={() => setSortBy(s)} 
                  className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors capitalize ${
                    sortBy === s 
                      ? 'bg-open-bg border-primary-light text-primary-dark font-semibold' 
                      : 'bg-white border-gray-200 text-gray-500 font-medium hover:bg-gray-50'
                  }`}
                >
                  {/* @ts-ignore */}
                  {t(`sort.${s}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: "minor", label: t('filter.minor'), st: filterExp, set: setFilterExp, colorClass: "text-steel-700 bg-steel-50 border-steel-200" },
                { key: "elderly", label: t('filter.elderly'), st: filterExp, set: setFilterExp, colorClass: "text-steel-700 bg-steel-50 border-steel-200" },
                { key: "difficult_veins", label: t('filter.difficult_veins'), st: filterExp, set: setFilterExp, colorClass: "text-steel-700 bg-steel-50 border-steel-200" },
                { key: "centrifuge", label: t('filter.centrifuge'), st: filterEquip, set: setFilterEquip, colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                { key: "freezer", label: t('filter.freezer'), st: filterEquip, set: setFilterEquip, colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              ].map(f => {
                // @ts-ignore dynamic typing intentionally loose here
                const isActive = f.st[f.key];
                return (
                  <button 
                    key={f.key} 
                    // @ts-ignore
                    onClick={() => f.set({ ...f.st, [f.key]: !isActive })} 
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                      isActive ? f.colorClass : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BC Cards */}
          <div className="flex flex-col gap-3.5">
            {filtered.map(bc => {
              const isApproved = approved.has(bc.id);
              return (
                <div key={bc.id} className={`
                  bg-white rounded-[18px] overflow-hidden transition-all duration-200 border relative
                  ${isApproved ? 'border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.12)]' : bc.bestMatch ? 'border-primary-light shadow-sm' : 'border-gray-200'}
                `}>
                  {bc.bestMatch && !isApproved && (
                    <div className="bg-open-bg/80 py-1.5 text-center text-[11px] font-bold text-primary-dark tracking-wide flex items-center justify-center gap-1.5 border-b border-primary-light">
                      <Verified className="w-3.5 h-3.5" />
                      {t('card.bestMatch')}
                    </div>
                  )}
                  {isApproved && (
                    <div className="bg-emerald-500 py-1.5 text-center text-[11px] font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      {t('card.approved')}
                    </div>
                  )}

                  <div className="p-5 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 items-start">
                      
                      {/* Photo + info */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative">
                          <img src={bc.photo} alt={bc.name} className={`w-[60px] h-[60px] rounded-full object-cover border-2 ${isApproved ? 'border-emerald-500' : 'border-gray-200'}`} />
                          {isApproved && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="font-heading text-[17px] font-medium text-near-black">{bc.name}</div>
                            {bc.invited_by_hc && (
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {t('card.hcInvited')}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] text-gray-500 mb-2">
                            {bc.qualification} &middot; {t('card.appliedAgo', { hours: bc.applied_at ? Math.ceil((Date.now() - new Date(bc.applied_at).getTime()) / (1000 * 60 * 60)) : 0 })}
                          </div>
                          <div className="flex gap-3.5 items-center">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-heading text-[14px] font-medium text-near-black leading-none">{bc.rating}</span>
                              <span className="text-[11px] text-gray-500">({bc.ratingCount})</span>
                            </div>
                            <div className="w-px h-3.5 bg-gray-200" />
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-steel-500" />
                              <span className="text-[12px] font-semibold text-steel-600">{bc.collections.toLocaleString()}</span>
                            </div>
                            <div className="w-px h-3.5 bg-gray-200" />
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-[12px] font-semibold text-near-black">{bc.distance} km</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 justify-start md:justify-center self-center max-w-[280px]">
                        {bc.expChildren && <Badge variant="info">{t('filter.minor')}</Badge>}
                        {bc.expElderly && <Badge variant="info">{t('filter.elderly')}</Badge>}
                        {bc.expRollvenen && <Badge variant="warning">{t('filter.difficult_veins')}</Badge>}
                        {bc.expObese && <Badge variant="info">Obese</Badge>}
                        {bc.hasCentrifuge && <Badge variant="success">{t('filter.centrifuge')}</Badge>}
                        {bc.hasFreezer && <Badge variant="success">{t('filter.freezer')}</Badge>}
                      </div>

                      {/* Price + action */}
                      <div className="text-left md:text-right min-w-[150px]">
                        <div className="text-[11px] text-gray-500">{t('card.estFee')}</div>
                        <div className="font-heading text-[26px] font-medium text-near-black mb-0.5 leading-none">€{bc.totalFee.toFixed(2)}</div>
                        <div className="text-[11px] text-gray-500 mb-2.5">{t('card.includesTravel')}</div>
                        <button 
                          onClick={() => toggleApprove(bc.id)} 
                          className={`w-full rounded-full py-2 px-5 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                            isApproved 
                              ? 'bg-white text-primary-dark border-gray-200 hover:bg-open-bg' 
                              : 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600'
                          }`}
                        >
                          {isApproved ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                          {isApproved ? t('card.remove') : t('card.addToShortlist')}
                        </button>
                      </div>
                    </div>

                    {/* Bottom row */}
                    {bc.bc_message && (
                      <div className="mt-3.5 pt-3.5 border-t border-gray-200">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {t('card.messageFromBc')}</div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] text-near-black italic">
                          "{bc.bc_message}"
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-3 pt-3 border-t border-gray-200 gap-2">
                       <div className="flex items-center gap-1.5">
                        <Building2 className="w-[14px] h-[14px] text-gray-500" />
                        <span className="text-[12px] text-gray-500 truncate max-w-[250px]">{bc.practiceAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-[14px] h-[14px] text-emerald-600" />
                        <span className="text-[12px] font-semibold text-emerald-600">{bc.nextSlot}</span>
                        <span className="rounded-full text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100">{t('card.slots', { count: bc.slotsAvailable })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-[16px] border border-gray-200 p-12 text-center shadow-sm">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <div className="font-heading text-lg font-medium text-near-black mb-2">{t('empty.title')}</div>
              <div className="text-[14px] text-gray-500 mb-5">{t('empty.desc')}</div>
              <button 
                onClick={() => { setFilterExp({ minor: false, elderly: false, difficult_veins: false }); setFilterEquip({ centrifuge: false, freezer: false }); }}
                className="px-6 py-2.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium hover:bg-gray-50 transition-colors"
              >
                {t('empty.clearBtn')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Sticky Shortlist Summary */}
      {!sent && approved.size > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-gray-200 p-4 md:px-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row justify-between items-center gap-4 z-40">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {approvedList.map((bc, i) => (
                <img key={bc.id} src={bc.photo} alt={bc.name} className="w-9 h-9 rounded-full object-cover border-2 border-white relative" style={{ zIndex: approvedList.length - i }} />
              ))}
            </div>
            <div>
              <div className="text-[14px] font-bold text-near-black">
                {t('footer.onShortlist', { count: approved.size })}
              </div>
              <div className="text-[12px] text-gray-500 hidden sm:block">
                {t('footer.patientWillChoose', { names: approvedList.map(c => c.name.split(" ")[0]).join(", ") })}
              </div>
            </div>
          </div>
          <button 
            onClick={handleSendShortlist} 
            disabled={isSending}
            className="w-full sm:w-auto bg-primary-dark hover:bg-primary-dark disabled:opacity-70 text-white rounded-full px-6 py-3 text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary-dark/20 transition-all hover:-translate-y-0.5 min-w-[200px]"
          >
            {isSending ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Send className="w-[18px] h-[18px]" />
            )}
            {isSending ? t('footer.sending') : t('footer.sendBtn')}
          </button>
        </div>
      )}
    </div>
  );
}
