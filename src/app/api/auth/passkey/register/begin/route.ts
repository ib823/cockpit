import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { generateRegistrationOptions, rpName, rpID, challenges } from "@/lib/webauthn";
import { logger } from "@/lib/logger";

// POST /api/auth/passkey/register/begin - Start passkey registration
export const POST = withAuth(async (_req, auth) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: auth.userId },
      include: {
        Authenticator: {
          select: {
            id: true,
            counter: true,
            publicKey: true,
            transports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email,
      // Exclude existing authenticators to prevent re-registration
      excludeCredentials: user.Authenticator.map((authenticator) => ({
        id: Buffer.from(authenticator.publicKey).toString("base64url"),
        transports: authenticator.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    // Store challenge for verification
    await challenges.set(user.id, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    logger.error("Passkey registration begin error", { error: error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
