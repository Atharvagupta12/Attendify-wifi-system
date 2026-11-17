import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serverError } from "@/lib/api"

/** Public list of classes, used by the student signup form. */
export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      orderBy: [{ className: "asc" }, { section: "asc" }],
    })
    return NextResponse.json({
      data: classes.map((c) => ({ id: c.id, label: `${c.className}-${c.section}` })),
    })
  } catch (error) {
    return serverError("classes", error)
  }
}
