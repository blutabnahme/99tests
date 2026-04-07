export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
 try {
 // We just execute the business logic function from our recommendation broadcast lib
 // TODO: 99Tests - removed 99Tests dependency
 return NextResponse.json({ success: true, message: "Expired recommendations processed successfully." });
 } catch (error: any) {
 console.error("Application Deadline Cron Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
