import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { scheduleId } = await req.json();

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId required" },
        { status: 400 }
      );
    }

    // Delete child attendance first
    await prisma.attendance.deleteMany({
      where: {
        scheduleId,
      },
    });

    // Delete schedule
    await prisma.schedule.delete({
      where: {
        id: scheduleId,
      },
    });

    return NextResponse.json({
      message: "Class deleted successfully",
    });

  } catch (error: any) {
    console.log("❌ Delete Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Server error",
      },
      { status: 500 }
    );
  }
}