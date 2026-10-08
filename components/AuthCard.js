"use client";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
        <div className="text-center">
          <div className="text-2xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>MEDIX</div>
          {title && <div className="text-sm font-bold" style={{ color: "#F4EAD2" }}>{title}</div>}
          {subtitle && <div className="text-xs mt-1" style={{ color: "#8393B5" }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
