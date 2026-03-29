import { NextResponse } from 'next/server';
import { handlePullSync, parsePullInput } from '../_lib/server-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parsePullInput(body);
    const payload = await handlePullSync(input);

    return NextResponse.json({ data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to pull sync data';
    const status = message.includes('No synced data found') ? 404 : 400;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
