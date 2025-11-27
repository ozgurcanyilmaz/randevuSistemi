import React, { type PropsWithChildren, type CSSProperties } from "react";
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
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({ title, children, className, style, onClick, onMouseEnter, onMouseLeave }) => (
  <div 
    style={{ ...commonStyles.card, ...style }} 
    className={className} 
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
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
  title?: string;
}

export const Button: React.FC<ButtonProps & { style?: CSSProperties }> = ({
  variant = "primary",
  onClick,
  disabled,
  type = "button",
  children,
  fullWidth,
  style,
  title,
}) => {
  const baseStyle = disabled
    ? commonStyles.button.disabled
    : commonStyles.button[variant];
  const finalStyle = fullWidth
    ? { ...baseStyle, width: "100%", ...style }
    : { ...baseStyle, ...style };
  const hoverHandlers = !disabled ? getButtonHoverHandlers(variant) : {};

  return (
    <button
      type={type}
      style={finalStyle}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...hoverHandlers}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  variant: "success" | "warning" | "error" | "primary" | "gray";
  children: React.ReactNode;
  style?: CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, style }) => (
  <span style={{ ...commonStyles.badge[variant], ...style }}>{children}</span>
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
  label?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
  name?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
  min?: string | number;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = "text",
      value,
      onChange,
      placeholder,
      disabled,
      required,
      error,
      readOnly,
      className,
      style,
      name,
      onBlur,
      onFocus,
      onKeyPress,
      onKeyDown,
      maxLength,
      min,
    },
    ref
  ) => (
    <div>
      {label && (
        <label style={commonStyles.formLabel}>
          {label} {required && "*"}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        style={{
          ...commonStyles.input,
          ...(readOnly && { background: colors.gray[50], cursor: "not-allowed" }),
          ...style,
        }}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        maxLength={maxLength}
        min={min !== undefined ? String(min) : undefined}
      />
      {error && (
        <div
          style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}
        >
          {error}
        </div>
      )}
    </div>
  )
);
Input.displayName = "Input";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  style?: CSSProperties;
  className?: string;
  name?: string;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  ref?: React.Ref<HTMLSelectElement>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      value,
      onChange,
      options,
      placeholder,
      disabled,
      required,
      error,
      style,
      className,
      name,
      onBlur,
    },
    ref
  ) => (
    <div>
      {label && (
        <label style={commonStyles.formLabel}>
          {label} {required && "*"}
        </label>
      )}
      <select
        ref={ref}
        name={name}
        style={{ ...commonStyles.select, ...style }}
        className={className}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div
          style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}
        >
          {error}
        </div>
      )}
    </div>
  )
);
Select.displayName = "Select";

interface TextareaProps {
  label?: string;
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
    {label && (
      <label style={commonStyles.formLabel}>
        {label} {required && "*"}
      </label>
    )}
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
