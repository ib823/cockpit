import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/auth/with-auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { validateRequest, ValidationError, UserUpdateSchema } from "@/lib/api-validators";
import { validationErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export const PATCH = withAdmin<{ params: Promise<{ id: string }> }>(
  async (req, _auth, { params }) => {
    try {
      const { id } = await params;

      const body = await req.json();

      // Validate input against the canonical user-update schema.
      let data: z.infer<typeof UserUpdateSchema>;
      try {
        data = validateRequest(UserUpdateSchema, body);
      } catch (err) {
        if (err instanceof ValidationError) {
          return validationErrorResponse(err);
        }
        throw err;
      }
      const { email, name, role, accessExpiresAt, exception } = data;

      // Check if user exists
      const existingUser = await prisma.users.findUnique({ where: { id } });

      if (!existingUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check if email is already taken by another user
      if (email && email !== existingUser.email) {
        const emailTaken = await prisma.users.findUnique({ where: { email } });

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
      if (accessExpiresAt !== undefined) updateData.accessExpiresAt = accessExpiresAt;
      if (exception !== undefined) updateData.exception = exception;

      // Update user
      const user = await prisma.users.update({ where: { id }, data: updateData });

      return NextResponse.json({ user }, { headers: { "Content-Type": "application/json" } });
    } catch (e: unknown) {
      logger.error("update user error", { error: e });
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);

export const DELETE = withAdmin<{ params: Promise<{ id: string }> }>(
  async (_req, _auth, { params }) => {
    try {
      const { id } = await params;

      await prisma.users.delete({ where: { id } });

      return NextResponse.json({ ok: true }, { headers: { "Content-Type": "application/json" } });
    } catch (e: unknown) {
      logger.error("delete user error", { error: e });
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
