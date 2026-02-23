import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/contactSchema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, message } = result.data;

    // Here you would integrate an email service like Resend/SendGrid
    // For now we just log and return success
    console.log("Contact form submission:", {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "پیام شما با موفقیت دریافت شد. به زودی با شما تماس می‌گیریم.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطایی در سرور رخ داده است. لطفاً دوباره تلاش کنید.",
      },
      { status: 500 },
    );
  }
}
