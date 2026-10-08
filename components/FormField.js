"use client";
export default function FormField({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "#8393B5" }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }}
      />
    </div>
  );
    }
          
