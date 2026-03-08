import { processDueEmailSequences } from "@/lib/email/sequences";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function runEmailSequenceProcessor() {
  try {
    const summary = await processDueEmailSequences();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process sequences.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return runEmailSequenceProcessor();
}

export async function POST(request: Request) {
  const expectedSecret = process.env.EMAIL_SEQUENCE_CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "EMAIL_SEQUENCE_CRON_SECRET is missing." },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return runEmailSequenceProcessor();
}
