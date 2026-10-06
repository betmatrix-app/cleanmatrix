const BADGE_VARIANTS = {
  red:    'bg-red-500/15 text-red-400 border border-red-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  green:  'bg-green-500/15 text-green-400 border border-green-500/20',
  blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  gray:   'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
};

export function Badge({ variant = 'gray', children, dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${BADGE_VARIANTS[variant]}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'red' ? 'bg-red-400' :
          variant === 'orange' ? 'bg-orange-400' :
          variant === 'yellow' ? 'bg-yellow-400' :
          variant === 'green' ? 'bg-green-400' :
          variant === 'blue' ? 'bg-blue-400' :
          'bg-slate-400'
        }`} />
      )}
      {children}
    </span>
  );
}

const BTN_VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent2',
  ghost:   'bg-transparent text-slate-400 border border-border hover:bg-surface2 hover:text-slate-200',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25',
  success: 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25',
};

export function Button({ variant = 'ghost', children, onClick, disabled, className = '', size = 'md' }) {
  const sizes = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3.5 py-1.5 text-[12px]',
    lg: 'px-4 py-2 text-[13px]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150
        ${sizes[size]} ${BTN_VARIANTS[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return (
    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.8px] mb-3.5">
      {children}
    </div>
  );
}

const ALERT_VARIANTS = {
  red:    'bg-red-500/10 border border-red-500/25 text-red-300',
  orange: 'bg-orange-500/10 border border-orange-500/25 text-orange-300',
  yellow: 'bg-yellow-500/10 border border-yellow-500/25 text-yellow-300',
  blue:   'bg-blue-500/10 border border-blue-500/25 text-blue-300',
};

export function Alert({ variant = 'blue', children }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[12px] mb-3 ${ALERT_VARIANTS[variant]}`}>
      {children}
    </div>
  );
}

const KPI_COLORS = {
  red:    { bar: 'bg-red-500',    val: 'text-red-400'    },
  orange: { bar: 'bg-orange-500', val: 'text-orange-400' },
  green:  { bar: 'bg-green-500',  val: 'text-green-400'  },
  blue:   { bar: 'bg-accent',     val: 'text-accent'     },
  purple: { bar: 'bg-purple-500', val: 'text-purple-400' },
};

export function KpiCard({ label, value, sub, color = 'blue' }) {
  const { bar, val } = KPI_COLORS[color];
  return (
    <div className="bg-surface border border-border rounded-xl px-[18px] py-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bar}`} />
      <div className="text-[11px] text-slate-500 uppercase tracking-[0.7px]">{label}</div>
      <div className={`font-mono text-[32px] font-semibold my-1.5 leading-none ${val}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-3.5 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.8px] border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-border/50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-blue-500/[0.04]' : 'hover:bg-blue-500/[0.04]'}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-3.5 py-[11px] align-middle ${className}`}>{children}</td>
  );
}
