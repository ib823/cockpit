import React from "react";
import { LucideIcon } from "lucide-react";
import { Heading3, BodyMD } from "./Typography";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  };
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="bg-secondary rounded-lg p-12 text-center shadow-sm">
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="w-16 h-16 text-tertiary" />
        </div>
      )}

      <Heading3 className="text-primary mb-2">{title}</Heading3>

      {description && (
        <BodyMD className="text-secondary mb-6 max-w-md mx-auto">{description}</BodyMD>
      )}

      {action && (
        <Button variant={action.variant || "primary"} size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
}
