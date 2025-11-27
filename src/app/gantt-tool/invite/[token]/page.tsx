"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, Spin, Result, Card, Descriptions, Typography, Space } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface InviteDetails {
  project: {
    id: string;
    name: string;
    description: string | null;
    owner: {
      name: string | null;
      email: string;
    };
  };
  role: string;
  invitedBy: {
    name: string | null;
    email: string;
  };
  invitedEmail: string;
  createdAt: string;
  expiresAt: string | null;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/gantt-tool/invite/${token}`)}`;
      router.push(loginUrl);
    }
  }, [sessionStatus, router, token]);

  // Fetch invite details when authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated" && token) {
      fetchInviteDetails();
    }
  }, [sessionStatus, token]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gantt-tool/invites/${token}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("This invite link is invalid or does not exist.");
        } else if (response.status === 410) {
          setError(data.error || "This invite link has expired or has already been used.");
        } else {
          setError(data.error || "Failed to load invite details.");
        }
        setInviteDetails(null);
      } else {
        setInviteDetails(data);
      }
    } catch (err) {
      console.error("Failed to fetch invite details:", err);
      setError("Failed to load invite details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/gantt-tool/invites/${token}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            `This invite was sent to ${data.invitedEmail}. You are currently logged in as ${data.currentEmail}. Please log in with the invited email address.`
          );
        } else if (response.status === 409) {
          setError("You are already a collaborator on this project.");
          // Redirect to project after 2 seconds
          setTimeout(() => {
            if (inviteDetails?.project.id) {
              router.push(`/gantt-tool?project=${inviteDetails.project.id}`);
            }
          }, 2000);
        } else if (response.status === 410) {
          setError(data.error || "This invite has expired or has already been used.");
        } else {
          setError(data.error || "Failed to accept invite.");
        }
      } else {
        setAccepted(true);
        // Redirect to project after 2 seconds
        setTimeout(() => {
          router.push(`/gantt-tool?project=${data.project.id}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to accept invite:", err);
      setError("Failed to accept invite. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  // Show loading state while checking authentication
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Show loading state while fetching invite details
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading invite details..." />
      </div>
    );
  }

  // Show error state
  if (error && !inviteDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Result
          status="error"
          title="Unable to Load Invite"
          subTitle={error}
          extra={[
            <Button type="primary" key="dashboard" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>,
          ]}
        />
      </div>
    );
  }

  // Show success state after accepting
  if (accepted && inviteDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Result
          status="success"
          title="Successfully Joined Project!"
          subTitle={`You now have ${inviteDetails.role} access to "${inviteDetails.project.name}". Redirecting to project...`}
          icon={<CheckCircleOutlined />}
        />
      </div>
    );
  }

  // Show invite details and accept button
  if (inviteDetails) {
    const roleColors: Record<string, string> = {
      OWNER: "purple",
      EDITOR: "blue",
      VIEWER: "green",
    };

    const roleDescriptions: Record<string, string> = {
      OWNER: "Full access including sharing and deleting the project",
      EDITOR: "Can view and edit all project content",
      VIEWER: "Can view project content (read-only access)",
    };

    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <Card
          className="max-w-2xl w-full"
          title={
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined /> Project Invitation
              </Title>
              <Text type="secondary">
                You've been invited to collaborate on a project
              </Text>
            </Space>
          }
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Project Name">
                <Text strong>{inviteDetails.project.name}</Text>
              </Descriptions.Item>

              {inviteDetails.project.description && (
                <Descriptions.Item label="Description">
                  {inviteDetails.project.description}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Project Owner">
                <Space>
                  <UserOutlined />
                  <Text>
                    {inviteDetails.project.owner.name || inviteDetails.project.owner.email}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Invited By">
                <Space>
                  <UserOutlined />
                  <Text>
                    {inviteDetails.invitedBy.name || inviteDetails.invitedBy.email}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Your Role">
                <Space direction="vertical" size={4}>
                  <Text
                    strong
                    style={{
                      color:
                        roleColors[inviteDetails.role] === "purple"
                          ? "#722ed1"
                          : roleColors[inviteDetails.role] === "blue"
                          ? "#1890ff"
                          : "#52c41a",
                    }}
                  >
                    {inviteDetails.role}
                  </Text>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {roleDescriptions[inviteDetails.role]}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Invited Email">
                <Text code>{inviteDetails.invitedEmail}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Invited On">
                <Space>
                  <CalendarOutlined />
                  <Text>{new Date(inviteDetails.createdAt).toLocaleString()}</Text>
                </Space>
              </Descriptions.Item>

              {inviteDetails.expiresAt && (
                <Descriptions.Item label="Expires On">
                  <Space>
                    <CalendarOutlined />
                    <Text>{new Date(inviteDetails.expiresAt).toLocaleString()}</Text>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            {error && (
              <Result
                status="warning"
                title={error}
                icon={<CloseCircleOutlined />}
              />
            )}

            <div className="flex gap-3 justify-end">
              <Button onClick={() => router.push("/dashboard")}>
                Decline
              </Button>
              <Button
                type="primary"
                icon={accepting ? <LoadingOutlined /> : <CheckCircleOutlined />}
                loading={accepting}
                onClick={acceptInvite}
                size="large"
              >
                Accept Invitation
              </Button>
            </div>

            {session?.user?.email && session.user.email !== inviteDetails.invitedEmail && (
              <Paragraph type="warning" style={{ marginTop: 16 }}>
                Note: This invite was sent to <Text code>{inviteDetails.invitedEmail}</Text> but
                you are logged in as <Text code>{session.user.email}</Text>. You may need to log in
                with the invited email address to accept this invitation.
              </Paragraph>
            )}
          </Space>
        </Card>
      </div>
    );
  }

  return null;
}
