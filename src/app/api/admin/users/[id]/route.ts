import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { email, name, role, accessExpiresAt, exception } = body;

    // Validation
    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (role && !["USER", "MANAGER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be USER, MANAGER, or ADMIN" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.users.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Build update data
    const updateData: {
      updatedAt: Date;
      email?: string;
      name?: string;
      role?: "USER" | "MANAGER" | "ADMIN";
      accessExpiresAt?: Date;
      exception?: boolean;
    } = {
      updatedAt: new Date(),
    };

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (accessExpiresAt !== undefined) updateData.accessExpiresAt = new Date(accessExpiresAt);
    if (exception !== undefined) updateData.exception = exception;

    // Update user
    const user = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user }, { headers: { "Content-Type": "application/json" } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("update user error", e);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.users.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true }, { headers: { "Content-Type": "application/json" } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("delete user error", e);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
