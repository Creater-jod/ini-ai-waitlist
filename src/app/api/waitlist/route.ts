import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, getSubscribers, getSubscriberCount, MAX_WAITLIST_CAPACITY } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const { subscriber, isNew, totalCount, isLimitReached } = await addSubscriber(email, {
      ip,
      userAgent,
    });

    if (isLimitReached) {
      return NextResponse.json(
        {
          success: false,
          error: "The early access waitlist has reached its 100-user limit!",
          limitReached: true,
          totalCount,
          maxCapacity: MAX_WAITLIST_CAPACITY,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: isNew
          ? "You have been added to the VIP waitlist!"
          : "You are already on the VIP waitlist!",
        subscriberId: subscriber?.id,
        spotNumber: totalCount,
        maxCapacity: MAX_WAITLIST_CAPACITY,
        isNew,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await getSubscriberCount();
    const list = await getSubscribers();
    return NextResponse.json({
      success: true,
      totalSubscribers: count,
      maxCapacity: MAX_WAITLIST_CAPACITY,
      isFull: count >= MAX_WAITLIST_CAPACITY,
      subscribers: list,
    });
  } catch (error) {
    console.error("Waitlist GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}
