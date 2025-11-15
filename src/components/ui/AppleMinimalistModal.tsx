/**
 * AppleMinimalistModal - Compatibility wrapper for BaseModal
 *
 * This is a temporary wrapper to maintain compatibility with modals
 * that were built for AppleMinimalistModal API. These should be
 * migrated to BaseModal directly.
 *
 * @deprecated Use BaseModal instead
 */

import { BaseModal, type BaseModalProps } from "./BaseModal";

export type FormField = {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

interface AppleMinimalistModalProps extends Omit<BaseModalProps, 'children'> {
  children?: React.ReactNode;
  fields?: FormField[];
  formValues?: Record<string, any>;
  onFieldChange?: (fieldId: string, value: any) => void;
  formLayout?: string;
}

/**
 * @deprecated Use BaseModal directly
 */
export function AppleMinimalistModal({ fields, formValues, onFieldChange, formLayout, ...baseProps }: AppleMinimalistModalProps) {
  // For now, just pass through to BaseModal and ignore form-specific props
  // The modals using this handle their own form rendering in children
  return <BaseModal {...baseProps} />;
}

export default AppleMinimalistModal;
export type { FormField };
