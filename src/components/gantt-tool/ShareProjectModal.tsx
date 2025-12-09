/**
 * ShareProjectModal - Project Collaboration Sharing
 *
 * Professional sharing interface for presales-to-project team collaboration.
 * Follows Apple HIG and design system tokens for consistency.
 *
 * Features:
 * - Copy project link to clipboard
 * - Invite collaborators by email with role selection
 * - View and manage existing collaborators
 * - View and revoke pending invites
 * - Role-based permissions display
 *
 * Roles:
 * - OWNER: Full control including delete and share
 * - EDITOR: Can modify timeline, resources, and context
 * - RESOURCE_EDITOR: Can only modify resources and allocations
 * - VIEWER: Read-only access
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Send, Clock, UserPlus, X, ChevronDown } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

type CollaboratorRole = "OWNER" | "EDITOR" | "RESOURCE_EDITOR" | "VIEWER";

interface Collaborator {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  role: CollaboratorRole;
  invitedBy: {
    name: string | null;
    email: string | null;
  } | null;
  invitedAt: string;
  acceptedAt: string | null;
  lastAccessAt: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: CollaboratorRole;
  createdBy: {
    name: string | null;
    email: string | null;
  };
  createdAt: string;
  expiresAt: string | null;
}

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

const ROLE_INFO: Record<CollaboratorRole, { label: string; description: string; color: string }> = {
  OWNER: {
    label: "Owner",
    description: "Full control including delete and share",
    color: COLORS.blue,
  },
  EDITOR: {
    label: "Editor",
    description: "Can modify timeline, resources, and context",
    color: COLORS.status.success,
  },
  RESOURCE_EDITOR: {
    label: "Resource Editor",
    description: "Can only modify resources and allocations",
    color: COLORS.status.warning,
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to view the project",
    color: COLORS.text.secondary,
  },
};

export function ShareProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  isOwner,
}: ShareProjectModalProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>("VIEWER");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Data state
  const [owner, setOwner] = useState<Collaborator["user"] | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  // Project URL
  const projectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/gantt-tool?project=${projectId}`
    : "";

  // Fetch collaborators and invites
  const fetchShareData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gantt-tool/projects/${projectId}/share`);
      if (!response.ok) {
        throw new Error("Failed to fetch sharing information");
      }

      const data = await response.json();
      setOwner(data.owner);
      setCollaborators(data.collaborators || []);
      setPendingInvites(data.pendingInvites || []);
    } catch (err) {
      console.error("Error fetching share data:", err);
      setError("Failed to load sharing information");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchShareData();
      setEmail("");
      setSelectedRole("VIEWER");
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, fetchShareData]);

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Send invite
  const handleSendInvite = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/gantt-tool/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role: selectedRole,
          expiresInDays: 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setSuccess(`Invite sent to ${email.trim()}`);
      setEmail("");
      await fetchShareData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error sending invite:", err);
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsSending(false);
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm("Remove this collaborator? They will lose access to the project.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/gantt-tool/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to remove collaborator");
      }

      await fetchShareData();
    } catch (err) {
      console.error("Error removing collaborator:", err);
      setError("Failed to remove collaborator");
    }
  };

  // Cancel invite
  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(
        `/api/gantt-tool/projects/${projectId}/share/${inviteId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel invite");
      }

      await fetchShareData();
    } catch (err) {
      console.error("Error canceling invite:", err);
      setError("Failed to cancel invite");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const availableRoles: CollaboratorRole[] = ["EDITOR", "RESOURCE_EDITOR", "VIEWER"];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Project"
      subtitle={`Invite team members to collaborate on "${projectName}"`}
      size="medium"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[5] }}>
        {/* Copy Link Section */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: SPACING[2],
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
            }}
          >
            Project Link
          </label>
          <div
            style={{
              display: "flex",
              gap: SPACING[2],
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                flex: 1,
                padding: `${SPACING[2]} ${SPACING[3]}`,
                backgroundColor: COLORS.bg.subtle,
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: RADIUS.default,
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                color: COLORS.text.secondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
              }}
            >
              {projectUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING[1],
                padding: `0 ${SPACING[4]}`,
                backgroundColor: copied ? COLORS.status.success : COLORS.blue,
                color: "#FFFFFF",
                border: "none",
                borderRadius: RADIUS.default,
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                cursor: "pointer",
                transition: `all ${TRANSITIONS.duration.fast}`,
                minWidth: "100px",
              }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Invite Section - Only for owners */}
        {isOwner && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: SPACING[2],
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.secondary,
              }}
            >
              Invite by Email
            </label>
            <div
              style={{
                display: "flex",
                gap: SPACING[2],
                alignItems: "stretch",
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendInvite();
                  }
                }}
                style={{
                  flex: 1,
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  backgroundColor: COLORS.bg.primary,
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: RADIUS.default,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.body,
                  outline: "none",
                  transition: `border-color ${TRANSITIONS.duration.fast}`,
                }}
              />

              {/* Role Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[1],
                    padding: `0 ${SPACING[3]}`,
                    height: "100%",
                    backgroundColor: COLORS.bg.primary,
                    border: `1px solid ${COLORS.border.default}`,
                    borderRadius: RADIUS.default,
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.text.primary,
                    cursor: "pointer",
                    minWidth: "140px",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: ROLE_INFO[selectedRole].color }}>
                    {ROLE_INFO[selectedRole].label}
                  </span>
                  <ChevronDown className="w-4 h-4" style={{ color: COLORS.text.tertiary }} />
                </button>

                {showRoleDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      width: "220px",
                      backgroundColor: COLORS.bg.primary,
                      border: `1px solid ${COLORS.border.default}`,
                      borderRadius: RADIUS.default,
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowRoleDropdown(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: `${SPACING[3]} ${SPACING[4]}`,
                          textAlign: "left",
                          backgroundColor:
                            selectedRole === role ? COLORS.interactive.hover : "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: `background-color ${TRANSITIONS.duration.fast}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.interactive.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            selectedRole === role ? COLORS.interactive.hover : "transparent";
                        }}
                      >
                        <div
                          style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.caption,
                            fontWeight: TYPOGRAPHY.fontWeight.semibold,
                            color: ROLE_INFO[role].color,
                            marginBottom: "2px",
                          }}
                        >
                          {ROLE_INFO[role].label}
                        </div>
                        <div
                          style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.label,
                            color: COLORS.text.tertiary,
                          }}
                        >
                          {ROLE_INFO[role].description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isSending || !email.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING[1],
                  padding: `0 ${SPACING[4]}`,
                  backgroundColor: isSending || !email.trim() ? COLORS.text.disabled : COLORS.blue,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: RADIUS.default,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  cursor: isSending || !email.trim() ? "not-allowed" : "pointer",
                  transition: `all ${TRANSITIONS.duration.fast}`,
                  minWidth: "88px",
                }}
              >
                {isSending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div
            style={{
              padding: SPACING[3],
              backgroundColor: COLORS.redLight,
              borderRadius: RADIUS.default,
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.red,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: SPACING[3],
              backgroundColor: "rgba(52, 199, 89, 0.1)",
              borderRadius: RADIUS.default,
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.status.success,
            }}
          >
            {success}
          </div>
        )}

        {/* Team Members Section */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: SPACING[3],
            }}
          >
            <label
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.secondary,
              }}
            >
              Team Members
            </label>
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.label,
                color: COLORS.text.tertiary,
              }}
            >
              {(collaborators.length + (owner ? 1 : 0))} member{collaborators.length + (owner ? 1 : 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: SPACING[4],
                textAlign: "center",
                color: COLORS.text.tertiary,
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
              }}
            >
              Loading...
            </div>
          ) : (
            <div
              style={{
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: RADIUS.default,
                overflow: "hidden",
              }}
            >
              {/* Owner */}
              {owner && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[3],
                    padding: SPACING[3],
                    backgroundColor: COLORS.bg.primary,
                    borderBottom: `1px solid ${COLORS.border.default}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.full,
                      backgroundColor: COLORS.blueLight,
                      color: COLORS.blue,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      flexShrink: 0,
                    }}
                  >
                    {owner.image ? (
                      <img
                        src={owner.image}
                        alt={owner.name || "Owner"}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: RADIUS.full,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getInitials(owner.name, owner.email)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily.text,
                        fontSize: TYPOGRAPHY.fontSize.body,
                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                        color: COLORS.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {owner.name || owner.email}
                    </div>
                    {owner.name && owner.email && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                          fontSize: TYPOGRAPHY.fontSize.label,
                          color: COLORS.text.tertiary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {owner.email}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: `${SPACING[1]} ${SPACING[2]}`,
                      backgroundColor: COLORS.blueLight,
                      borderRadius: RADIUS.small,
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.label,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.blue,
                    }}
                  >
                    Owner
                  </div>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[3],
                    padding: SPACING[3],
                    backgroundColor: COLORS.bg.primary,
                    borderBottom: `1px solid ${COLORS.border.default}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.full,
                      backgroundColor: `${ROLE_INFO[collab.role].color}15`,
                      color: ROLE_INFO[collab.role].color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      flexShrink: 0,
                    }}
                  >
                    {collab.user.image ? (
                      <img
                        src={collab.user.image}
                        alt={collab.user.name || "User"}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: RADIUS.full,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getInitials(collab.user.name, collab.user.email)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily.text,
                        fontSize: TYPOGRAPHY.fontSize.body,
                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                        color: COLORS.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {collab.user.name || collab.user.email}
                    </div>
                    {collab.user.name && collab.user.email && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                          fontSize: TYPOGRAPHY.fontSize.label,
                          color: COLORS.text.tertiary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {collab.user.email}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: `${SPACING[1]} ${SPACING[2]}`,
                      backgroundColor: `${ROLE_INFO[collab.role].color}15`,
                      borderRadius: RADIUS.small,
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.label,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: ROLE_INFO[collab.role].color,
                    }}
                  >
                    {ROLE_INFO[collab.role].label}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(collab.id)}
                      style={{
                        padding: SPACING[1],
                        backgroundColor: "transparent",
                        border: "none",
                        borderRadius: RADIUS.small,
                        cursor: "pointer",
                        color: COLORS.text.tertiary,
                        transition: `color ${TRANSITIONS.duration.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.red;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.text.tertiary;
                      }}
                      title="Remove collaborator"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {!owner && collaborators.length === 0 && (
                <div
                  style={{
                    padding: SPACING[4],
                    textAlign: "center",
                    color: COLORS.text.tertiary,
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                  }}
                >
                  No team members yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING[2],
                marginBottom: SPACING[3],
              }}
            >
              <Clock className="w-4 h-4" style={{ color: COLORS.status.warning }} />
              <label
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.secondary,
                }}
              >
                Pending Invites
              </label>
            </div>

            <div
              style={{
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: RADIUS.default,
                overflow: "hidden",
              }}
            >
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[3],
                    padding: SPACING[3],
                    backgroundColor: COLORS.bg.subtle,
                    borderBottom: `1px solid ${COLORS.border.default}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: RADIUS.full,
                      backgroundColor: COLORS.interactive.hover,
                      color: COLORS.text.tertiary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily.text,
                        fontSize: TYPOGRAPHY.fontSize.body,
                        color: COLORS.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {invite.email}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily.text,
                        fontSize: TYPOGRAPHY.fontSize.label,
                        color: COLORS.text.tertiary,
                      }}
                    >
                      Invited {formatDate(invite.createdAt)}
                      {invite.expiresAt && ` • Expires ${formatDate(invite.expiresAt)}`}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: `${SPACING[1]} ${SPACING[2]}`,
                      backgroundColor: `${ROLE_INFO[invite.role].color}15`,
                      borderRadius: RADIUS.small,
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.label,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: ROLE_INFO[invite.role].color,
                    }}
                  >
                    {ROLE_INFO[invite.role].label}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(invite.id)}
                      style={{
                        padding: SPACING[1],
                        backgroundColor: "transparent",
                        border: "none",
                        borderRadius: RADIUS.small,
                        cursor: "pointer",
                        color: COLORS.text.tertiary,
                        transition: `color ${TRANSITIONS.duration.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.red;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.text.tertiary;
                      }}
                      title="Cancel invite"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role Legend */}
        <div
          style={{
            padding: SPACING[3],
            backgroundColor: COLORS.bg.subtle,
            borderRadius: RADIUS.default,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.label,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
              marginBottom: SPACING[2],
            }}
          >
            Role Permissions
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: SPACING[2],
            }}
          >
            {Object.entries(ROLE_INFO).map(([role, info]) => (
              <div
                key={role}
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.label,
                  color: COLORS.text.tertiary,
                  display: "flex",
                  alignItems: "center",
                  gap: SPACING[1],
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: RADIUS.full,
                    backgroundColor: info.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: info.color, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                  {info.label}:
                </span>
                <span>{info.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
