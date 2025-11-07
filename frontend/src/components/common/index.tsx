import type { PropsWithChildren } from "react";
import {
  commonStyles,
  colors,
  getButtonHoverHandlers,
} from "../../styles/commonStyles";

export const PageContainer: React.FC<PropsWithChildren> = ({ children }) => (
  <div style={commonStyles.pageContainer}>
    <div style={commonStyles.contentWrapper}>{children}</div>
  </div>
);

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => (
  <div style={commonStyles.pageHeader}>
    <h1 style={commonStyles.pageTitle}>{title}</h1>
    {subtitle && <p style={commonStyles.pageSubtitle}>{subtitle}</p>}
  </div>
);

interface CardProps extends PropsWithChildren {
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className }) => (
  <div style={commonStyles.card} className={className}>
    {title && <h2 style={commonStyles.cardHeader}>{title}</h2>}
    {children}
  </div>
);

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message }) => (
  <div style={commonStyles.alert[type]}>{message}</div>
);

interface ButtonProps {
  variant?: "primary" | "secondary" | "success" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  onClick,
  disabled,
  type = "button",
  children,
  fullWidth,
}) => {
  const baseStyle = disabled
    ? commonStyles.button.disabled
    : commonStyles.button[variant];
  const style = fullWidth ? { ...baseStyle, width: "100%" } : baseStyle;
  const hoverHandlers = !disabled ? getButtonHoverHandlers(variant) : {};

  return (
    <button
      type={type}
      style={style}
      onClick={onClick}
      disabled={disabled}
      {...hoverHandlers}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  variant: "success" | "warning" | "error" | "primary" | "gray";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => (
  <span style={commonStyles.badge[variant]}>{children}</span>
);

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div style={commonStyles.emptyState}>{message}</div>
);

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = "Yükleniyor...",
}) => <div style={commonStyles.loading}>{message}</div>;

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidth,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div style={commonStyles.modalOverlay} onClick={onClose}>
      <div
        style={{ ...commonStyles.modalContent, maxWidth: maxWidth || "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 style={commonStyles.modalTitle}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

interface InputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  required,
  error,
}) => (
  <div>
    <label style={commonStyles.formLabel}>
      {label} {required && "*"}
    </label>
    <input
      type={type}
      style={commonStyles.input}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
    {error && (
      <div
        style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}
      >
        {error}
      </div>
    )}
  </div>
);

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  required,
}) => (
  <div>
    <label style={commonStyles.formLabel}>
      {label} {required && "*"}
    </label>
    <select
      style={commonStyles.select}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface TextareaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  required,
}) => (
  <div>
    <label style={commonStyles.formLabel}>
      {label} {required && "*"}
    </label>
    <textarea
      style={commonStyles.textarea}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
    />
  </div>
);

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div style={commonStyles.tabContainer}>
    <div style={commonStyles.tabButtonWrapper}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={commonStyles.getTabButton(activeTab === tab.id)}
        >
          {tab.icon && `${tab.icon} `}
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);
