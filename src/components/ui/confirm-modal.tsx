"use client";

export function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  onConfirm,
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "danger" | "primary";
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-modal-overlay"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[400px] bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl animate-modal-content">
        <h3 className="text-[16px] font-semibold text-[#f2f2f2]">{title}</h3>
        <p className="text-[13px] text-[#888] mt-2">{body}</p>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              variant === "danger"
                ? "bg-[#f87171] hover:bg-[#ef4444] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all duration-150"
                : "bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all duration-150"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
