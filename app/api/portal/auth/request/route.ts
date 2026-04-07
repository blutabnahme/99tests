export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { findPatientByContact, createMagicLinkToken } from '@/lib/patient-auth';

export async function POST(request: Request) {
  try {
    const { contact, channel = 'email' } = await request.json();

    if (!contact || contact.trim().length < 3) {
      return NextResponse.json({ error: 'Please enter your email or phone number' }, { status: 400 });
    }

    // Find patient
    const patient = await findPatientByContact(contact.trim());

    // Always return success (don't reveal if patient exists — security)
    if (!patient) {
      return NextResponse.json({
        message: 'If an account exists, a login link has been sent.',
      });
    }

    // Create magic link token
    const result = await createMagicLinkToken(patient.id, channel);

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal/verify?token=${result.token}`;

    // TODO: Send via the appropriate channel
    // For now, log the URL (replace with Postmark/Twilio/WhatsApp in production)
    if (channel === 'email') {
      console.log(`[Portal] Magic link for ${patient.email}: ${portalUrl}`);
      // TODO: await sendEmail(patient.email, 'Your 99Tests Login Link', `Click here to access your portal: ${portalUrl}`);
    } else if (channel === 'sms') {
      console.log(`[Portal] Magic link SMS for ${patient.phone}: ${portalUrl}`);
      // TODO: await sendSMS(patient.phone, `Your 99Tests login link: ${portalUrl}`);
    } else if (channel === 'whatsapp') {
      console.log(`[Portal] Magic link WhatsApp for ${patient.phone}: ${portalUrl}`);
      // TODO: await sendWhatsApp(patient.phone, `Your 99Tests login link: ${portalUrl}`);
    }

    return NextResponse.json({
      message: 'If an account exists, a login link has been sent.',
      // DEV ONLY — remove in production:
      _dev_link: process.env.NODE_ENV === 'development' ? portalUrl : undefined,
    });
  } catch (error: any) {
    console.error('[Portal Auth] Request error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
