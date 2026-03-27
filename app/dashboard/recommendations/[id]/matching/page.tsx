import { createClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import MatchingShortlistClient from "./MatchingShortlistClient";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function MatchingShortlistPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations('hc.matching');

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Recommendation and Patient info
  const { data: recommendationData, error: recommendationErr } = await supabase
    .from("recommendation")
    .select(`
      *,
      patient (
        first_name,
        last_name,
        address
      )
    `)
    .eq("id", params.id)
    .single();

  if (recommendationErr || !recommendationData) {
    notFound();
  }

  // Security: Ensure the Doctor owns this recommendation
  if (recommendationData.doctor_id !== user.id) {
    redirect("/dashboard");
  }
  
  // Format Patient Name and Location
  const p = recommendationData.patient as any;
  const patientName = `${p.first_name} ${p.last_name}`;
  const location = p.address?.city || t('formatting.unknownLocation');
  
  // Format Test Type String
  const testTypes = Array.isArray(recommendationData.test_types) ? recommendationData.test_types : [];
  const testString = testTypes.length > 0 
    ? String(testTypes[0]) + (testTypes.length > 1 ? ` +${testTypes.length - 1}` : '')
    : t('formatting.generalDraw');

  const caseInfo = {
    id: recommendationData.id,
    patient: patientName,
    test: testString,
    urgency: recommendationData.urgency_level === 'urgent' ? t('formatting.urgent') : recommendationData.urgency_level === 'emergency' ? t('formatting.emergency') : t('formatting.standard'),
    type: recommendationData.mobility === 'home_visit' ? t('formatting.homeVisit') : t('formatting.practice'),
    address: location,
    deadline: recommendationData.application_deadline,
    mode: recommendationData.bc_selection_mode
  };

  if (recommendationData.bc_selection_mode === 'patient_decides') {
    return (
      <div className="p-10 max-w-[800px] mx-auto text-center mt-20">
        <h1 className="font-heading text-2xl font-medium text-near-black mb-2">{t('patientDecides.title')}</h1>
        <p className="text-gray-500 mb-6">{t('patientDecides.desc')}</p>
        <a href={`/dashboard/recommendations/${params.id}`} className="text-primary-dark font-bold hover:underline">{t('patientDecides.returnBtn')}</a>
      </div>
    );
  }

  // 2. Fetch Applications (instead of matches)
  const { data: applications, error: appErr } = await supabase
    .from("case_application")
    .select(`
      id,
      status,
      applied_at,
      bc_message,
      ranking_score,
      invited_by_hc,
      blood_collector (
        id, first_name, last_name, qualification, rating, total_collections,
        practice_fee, home_visit_fee, travel_fee_per_km, address, avatar_url, equipment, special_experience,
        address
      )
    `)
    .eq("recommendation_id", params.id)
    .in("status", ['invited', 'applied', 'accepted'])
    .order("ranking_score", { ascending: false });

  if (appErr) {
    console.error("Error fetching applications:", appErr);
  }

  // Calculate Distance Function
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const patientLat = recommendationData.patient?.address?.lat;
  const patientLng = recommendationData.patient?.address?.lng;

  // Transform Data for the Client Component
  const formattedCollectors = (applications || []).map((app: any) => {
    const bc = app.blood_collector;
    const equipment = bc.equipment || {};
    const spExp = bc.special_experience || {};
    
    // Distance
    let dist = 0;
    if (patientLat && patientLng && bc.address?.lat && bc.address?.lng) {
      dist = calculateDistance(patientLat, patientLng, bc.address.lat, bc.address.lng);
    }

    const isHome = recommendationData.mobility === 'home_visit' || recommendationData.mobility === 'home';
    const bcBaseFee = isHome ? bc.home_visit_fee : bc.practice_fee;
    const calcFee = Number(bcBaseFee || 0) + (dist * Number(bc.travel_fee_per_km || 0));

    return {
      app_id: app.id,
      id: bc.id,
      name: `${bc.first_name} ${bc.last_name}`,
      photo: bc.avatar_url || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=faces",
      qualification: bc.qualification || t('formatting.unspecified'),
      rating: bc.rating || 0.0,
      ratingCount: 0,
      collections: bc.total_collections || 0,
      distance: dist,
      practiceAddress: bc.address?.city ? `${bc.address.street || ''}, ${bc.address.city}` : t('formatting.addressNotProvided'),
      baseFee: Number(isHome ? bc.home_visit_fee : bc.practice_fee || 0),
      totalFee: calcFee,
      expMinor: !!spExp.minor || !!spExp.children,
      expElderly: !!spExp.elderly,
      expDifficultVeins: !!spExp.difficult_veins || !!spExp.rollvenen,
      expObese: !!spExp.obese,
      hasCentrifuge: !!equipment.centrifuge,
      hasFreezer: !!equipment.freezer,
      nextSlot: t('formatting.tomorrow'),
      slotsAvailable: Math.floor(Math.random() * 5) + 1,
      bestMatch: false, // We use sorting now
      
      // New fields from case_application
      status: app.status,
      applied_at: app.applied_at,
      bc_message: app.bc_message,
      ranking_score: app.ranking_score,
      invited_by_hc: app.invited_by_hc
    };
  });

  return (
    <div className="flex-1 bg-gray-50 min-w-0">
      <MatchingShortlistClient 
        caseInfo={caseInfo} 
        initialCollectors={formattedCollectors} 
      />
    </div>
  );
}
