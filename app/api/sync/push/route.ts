import { NextResponse } from 'next/server';
import { handlePushSync, parsePushInput } from '../_lib/server-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parsePushInput(body);
    const result = await handlePushSync(input);

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to push sync data',
      },
      { status: 400 }
    );
  }
}
