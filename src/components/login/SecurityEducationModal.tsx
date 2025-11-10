"use client";

interface SecurityEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function SecurityEducationModal({
  isOpen,
  onClose,
  onAccept,
}: SecurityEducationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50  flex items-center justify-center px-4">
      <style jsx>{`
        @keyframes float-down-3d {
          from {
            transform: translateY(-120%) translateZ(50px) rotateX(-15deg);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateZ(0px) rotateX(0deg);
            opacity: 1;
          }
        }
        .float-down-3d {
          animation: float-down-3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-amber-200 pointer-events-auto float-down-3d"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(251, 191, 36, 0.1)",
          perspective: "1000px",
          transform: "translateZ(20px)",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-6 border-b-2 border-amber-100">
          <div className="text-center">
            <h2 className="text-lg text-amber-900 font-semibold">Use Personal Devices Only</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-white text-center space-y-4">
          <p className="text-base text-slate-800">Your phone, laptop, or tablet</p>
          <p className="text-base text-slate-800 font-medium">Never on shared or public devices</p>
          <p className="text-sm text-slate-600">
            Does not work in private browsing (e.g., incognito, Tor)
          </p>
        </div>

        {/* Footer with Understood button */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-center">
          <button
            onClick={onAccept}
            className="px-8 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm shadow-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
