import { Button } from "./index";
import { commonStyles, colors } from "../../styles/commonStyles";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Başarılı!",
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div style={commonStyles.modalOverlay} onClick={onClose}>
      <div
        style={commonStyles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: colors.success[50],
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "32px",
            }}
          >
            ✓
          </div>
          <h2 style={commonStyles.modalTitle}>{title}</h2>
          <p
            style={{
              color: colors.gray[500],
              fontSize: "clamp(13px, 2vw, 15px)",
              lineHeight: "1.6",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
          <Button variant="success" onClick={onClose} fullWidth>
            Tamam
          </Button>
        </div>
      </div>
    </div>
  );
};
