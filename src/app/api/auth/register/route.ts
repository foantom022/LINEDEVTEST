import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  lineId: z.string().min(3, "LINE ID must be at least 3 characters").max(30),
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "Display name is required").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { lineId, email, displayName, password } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { lineId },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        )
      }
      if (existingUser.lineId === lineId) {
        return NextResponse.json(
          { error: "LINE ID already taken" },
          { status: 409 }
        )
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        lineId,
        email,
        displayName,
        passwordHash,
        isOnline: false,
      },
      select: {
        id: true,
        lineId: true,
        email: true,
        displayName: true,
        profileImage: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
