"use client";

type PreviewModalProps = {
  subject: string;
  summaryLine: string;
  recipientsLength: number;
  combinedBody: string;
  onClose: () => void;
};

export function PreviewModal({
  subject,
  summaryLine,
  recipientsLength,
  combinedBody,
  onClose,
}: PreviewModalProps) {
  return (
    <>
      <div
        className="rippl-modal-overlay z-50 bg-black/60 backdrop-blur-sm animate-modal-overlay"
        style={{ position: "fixed", inset: 0 }}
        onClick={onClose}
      />
      <div
        className="rippl-modal-center z-50 p-4 pointer-events-none"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto pointer-events-auto bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 shadow-xl">
          <h3 className="text-[16px] font-semibold text-[#f2f2f2]">Email preview</h3>
          <p className="text-[12px] text-[#888] mt-0.5">This is how your email will look when sent.</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-1">Subject</p>
              <p className="text-[14px] text-[#f2f2f2]">{subject || "(no subject)"}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-1">To</p>
              <p className="text-[13px] text-[#888]">{recipientsLength} recipient{recipientsLength !== 1 ? "s" : ""}</p>
              {recipientsLength > 0 && (
                <p className="text-[12px] text-[#888] mt-0.5 truncate">{summaryLine}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-1">Message</p>
              <div className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-3 py-3 text-[13px] text-[#f2f2f2] min-h-[120px] whitespace-pre-wrap">
                {combinedBody || "(empty)"}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1e1e1e] hover:bg-[#262626] border border-[rgba(255,255,255,0.08)] text-[#f2f2f2] text-[13px] font-medium px-4 py-1.5 rounded-[8px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
