import { NextResponse } from 'next/server';
import { handleStatusSync, parseStatusInput } from '../_lib/server-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseStatusInput(body);
    const result = await handleStatusSync(input);

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get sync status',
      },
      { status: 400 }
    );
  }
}
