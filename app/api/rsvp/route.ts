import { NextResponse } from 'next/server';

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf9x7l2z6Snx6GCY5FftyIuf_6o2-LfpqW0X_Ji0sXVW7SdOQ/formResponse';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const params = new URLSearchParams();
    params.append('entry.857192818',  body.name ?? '');
    params.append('entry.811463742',  body.phone ?? '');
    params.append('entry.490595501',  body.attending ?? '');
    params.append('entry.1092411044', body.partySize ?? '');

    const events: string[] = Array.isArray(body.events) ? body.events : body.events ? [body.events] : [];
    events.forEach((ev: string) => params.append('entry.1862080015', ev));

    params.append('entry.1347686639', body.emotionalGuess ?? '');
    params.append('entry.1948185072', body.weddingMood ?? '');
    params.append('entry.1876987010', body.note ?? '');
    params.append('entry.858860455',  body.leaveNote ?? '');

    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json({ success: false, error: 'Submission failed' }, { status: 500 });
  }
}

