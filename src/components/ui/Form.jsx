export function Field({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] text-slate-500 uppercase tracking-[0.5px] font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', disabled, required, className = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-slate-200
        placeholder-slate-600 outline-none focus:border-accent transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
}

export function Select({ value, onChange, children, disabled, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-slate-200
        outline-none focus:border-accent transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-slate-200
        placeholder-slate-600 outline-none focus:border-accent transition-colors resize-none w-full"
    />
  );
}

export function FormGrid({ cols = 2, children }) {
  const grid = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };
  return (
    <div className={`grid ${grid[cols]} gap-4`}>
      {children}
    </div>
  );
}

