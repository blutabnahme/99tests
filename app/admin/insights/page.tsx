import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { LineChart, BarChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
 const supabase = createServerSupabaseClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user || user.user_metadata?.role !== 'admin') {
 redirect("/dashboard");
 }

 return (
 <div className="flex-1 min-w-0 w-full mb-20 font-body">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight mb-2">Insights</h1>
 <p className="text-[15px] sm:text-[16px] text-gray-500 leading-relaxed max-w-[500px]">
 Platform analytics for 99Tests.
 </p>
 </div>
 </div>

 <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
 <LineChart className="w-12 h-12 text-primary mx-auto mb-4" />
 <p className="text-primary font-medium">99Tests Charts Coming soon</p>
 </div>
 </div>
 );
}
