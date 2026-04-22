import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      name,
      rollNumber,
      email,
      phone,
      password,
      className,
      section,
      macAddress,
      deviceName
    } = body

    // 🔥 validation
    if (
      !name ||
      !rollNumber ||
      !email ||
      !phone ||
      !password ||
      !className ||
      !section ||
      !macAddress
    ) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    // 🔥 check existing student
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { email },
          { rollNumber }
        ]
      }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student already exists" },
        { status: 400 }
      )
    }

    // 🔥 check if MAC already used
    const existingDevice = await prisma.device.findUnique({
      where: {
        macAddress
      }
    })

    if (existingDevice) {
      return NextResponse.json(
        { error: "Device already registered" },
        { status: 400 }
      )
    }

    // 🔥 find or create class
    let existingClass = await prisma.class.findFirst({
      where: {
        className,
        section
      }
    })

    if (!existingClass) {
      existingClass = await prisma.class.create({
        data: {
          className,
          section
        }
      })
    }

    // 🔥 hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔥 create student + device
    const student = await prisma.student.create({
      data: {
        name,
        rollNumber,
        email,
        phone,
        password: hashedPassword,
        classId: existingClass.id,
        device: {
          create: {
            macAddress,
            deviceName
          }
        }
      },
      include: {
        device: true,
        class: true
      }
    })

    return NextResponse.json({
      message: "Student registered successfully",
      student
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}