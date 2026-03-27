import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserSquare, Plus, Search, Calendar, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PatientsIndexPage() {
  const t = await getTranslations('hc.patients');
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all recommendations for this Doctor, joining patient data
  // Since multiple HCs might share a patient record but only see their own recommendations,
  // we use supabaseAdmin to strictly read the joined patient data bypassing strict RLS,
  // while tightly confining the query to the valid user's Doctor ID.
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: casesList } = await supabaseAdmin
    .from("recommendation")
    .select(`
      id, created_at,
      patient:patient_id (
        id, first_name, last_name, date_of_birth, contact_email, phone
      )
    `)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  console.log("--- PATIENT DIRECTORY DEBUG ---");
  console.log("USER ID:", user.id);
  console.log("CASES LIST RETURNED:", JSON.stringify(casesList, null, 2));
  console.log("-------------------------------");

  const validCases = casesList || [];

  // Group by Patient to get unique patients, recommendation count, and most recent recommendation date
  const patientMap = new Map();

  validCases.forEach(c => {
    const p = c.patient as any;
    if (!p) return;

    if (!patientMap.has(p.id)) {
      patientMap.set(p.id, {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        dob: p.date_of_birth,
        email: p.contact_email,
        phone: p.phone,
        casesCount: 1,
        lastCaseDate: c.created_at
      });
    } else {
      const existing = patientMap.get(p.id);
      existing.casesCount += 1;
      // Since recommendations are ordered by created_at DESC, the first one encountered is the newest
    }
  });

  const uniquePatients = Array.from(patientMap.values());

  return (
    <div className="flex-1 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">
            {t('index.title')}
          </h1>
          <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">
            {t('index.subtitle')}
          </p>
        </div>
        <Link 
          href="/dashboard/recommendations/new"
          className="w-full sm:w-auto bg-primary text-white rounded-full px-5 py-2.5 text-[13px] font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
          {t('index.newCaseButton')}
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="font-heading text-lg font-medium m-0 text-near-black flex items-center gap-2">
            <UserSquare className="w-5 h-5 text-gray-500" />
            {t('index.allPatients')}
          </h2>
          {/* We could add a search input here if needed to filter client side */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('index.searchPlaceholder')} 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-ruby-400 focus:bg-white transition-colors w-64"
            />
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.name')}</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.contact')}</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.dob')}</th>
                <th className="px-6 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.totalCases')}</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.latestCase')}</th>
                <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('index.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {uniquePatients.map((p, i) => (
                <tr key={p.id} className={`group hover:bg-gray-50 transition-colors ${i < uniquePatients.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[14px] text-near-black">{p.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
                        <Mail className="w-3.5 h-3.5" />
                        {p.email}
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
                          <Phone className="w-3.5 h-3.5" />
                          {p.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-near-black">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {p.dob ? format(new Date(p.dob), 'MMM d, yyyy') : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-near-black font-bold text-[13px]">
                      {p.casesCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-gray-500">
                    {format(new Date(p.lastCaseDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/patients/${p.id}`}
                      className="text-[13px] font-semibold text-primary hover:text-primary-dark hover:bg-open-bg px-4 py-2 rounded-full transition-colors"
                    >
                      {t('index.table.viewPatient')}
                    </Link>
                  </td>
                </tr>
              ))}
              
              {uniquePatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <UserSquare className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-[14px] font-medium">{t('index.empty.title')}</p>
                      <p className="text-[13px] mt-1">{t('index.empty.description')}</p>
                      <Link 
                        href="/dashboard/recommendations/new"
                        className="mt-4 px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-[13px] hover:bg-primary-dark shadow-none transition-colors"
                      >
                        {t('index.empty.createButton')}
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="mobile-card-list">
          {uniquePatients.map((p: any) => (
            <div
              key={p.id}
              className="border-b border-gray-100 p-4 cursor-pointer active:bg-gray-50 last:border-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[14px] font-medium text-near-black">
                    {p.name}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-0.5">{p.email}</div>
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-near-black font-bold text-[13px]">
                  {p.casesCount}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[12px] text-gray-500">
                <Link href={`/dashboard/patients/${p.id}`} className="text-primary-dark font-semibold">{t('index.table.viewPatient')}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
