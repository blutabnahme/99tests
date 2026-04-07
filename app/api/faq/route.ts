export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function GET() {
 try {
 const cookieStore = cookies();
 const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

 // Supported locales
 const supportedLocales = ["en", "de", "es", "nl", "fr"];
 const safeLocale = supportedLocales.includes(locale) ? locale : "en";

 const { data: faqs, error } = await supabaseAdmin
 .from('faq')
 .select('*')
 .eq('is_published', true)
 .order('category', { ascending: true })
 .order('sort_order', { ascending: true });

 if (error) {
 console.error("Supabase Error:", error);
 throw error;
 }

 // Map the requested locale into standardized "question" and "answer"
 const localizedFaqs = faqs.map((faq: any) => {
 const localizedQuestion = faq[`question_${safeLocale}`];
 const localizedAnswer = faq[`answer_${safeLocale}`];

 return {
 id: faq.id,
 category: faq.category,
 sort_order: faq.sort_order,
 question: localizedQuestion ? localizedQuestion : faq.question_en,
 answer: localizedAnswer ? localizedAnswer : faq.answer_en,
 };
 });
 
 return NextResponse.json(localizedFaqs);
 } catch (error: any) {
 console.error("Public FAQ API Error:", error.message);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
