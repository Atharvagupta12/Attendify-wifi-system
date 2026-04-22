import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId required" },
        { status: 400 },
      );
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        teacherId,
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const data = schedules.map((s) => ({
      scheduleId: s.id,
      subject: s.subject.subjectName,
      class: `${s.class.className}-${s.class.section}`,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const {
      teacherId,
      className,
      section,
      subjectName,
      dayOfWeek,
      startTime,
      endTime,
    } = await req.json();

    // ✅ Validation
    if (
      !teacherId ||
      !className ||
      !section ||
      !subjectName ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    // ✅ Normalize day
    const normalizedDay = dayOfWeek.toUpperCase();

    // ✅ Convert time safely
    const [sh, sm] = startTime.split(":");
    const [eh, em] = endTime.split(":");

    const start = new Date();
    start.setHours(Number(sh), Number(sm), 0);

    const end = new Date();
    end.setHours(Number(eh), Number(em), 0);

    // 🔥 1. CLASS (find or create)
    let classData = await prisma.class.findFirst({
      where: { className, section },
    });

    if (!classData) {
      classData = await prisma.class.create({
        data: { className, section },
      });
    }

    // 🔥 2. SUBJECT (find or create)
    let subjectData = await prisma.subject.findFirst({
      where: { subjectName },
    });

    if (!subjectData) {
      subjectData = await prisma.subject.create({
        data: {
          subjectName,
          subjectCode:
            subjectName.slice(0, 3).toUpperCase() +
            Math.floor(Math.random() * 1000),
        },
      });
    }

    // 🔥 3. Conflict check
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        classId: classData.id,
        dayOfWeek: normalizedDay,
        OR: [
          {
            startTime: { lte: end },
            endTime: { gte: start },
          },
        ],
      },
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: "Schedule conflict for this class" },
        { status: 400 },
      );
    }

    // 🔥 4. Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        teacherId,
        classId: classData.id,
        subjectId: subjectData.id,
        dayOfWeek: normalizedDay,
        startTime: start,
        endTime: end,
      },
      include: {
        class: true,
        subject: true,
      },
    });

    return NextResponse.json({
      message: "Class created successfully",
      data: {
        subject: schedule.subject.subjectName,
        class: `${schedule.class.className}-${schedule.class.section}`,
      },
    });
  } catch (error) {
    console.log("❌ Schedule Create Error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
