import { cn } from '../../lib/utils';

/**
 * Premium text input with glass styling and optional icon.
 * Consistent with the 3D design system.
 */
export default function GlassInput({
  icon: Icon,
  label,
  error,
  className,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 group-focus-within:text-indigo-400 transition-colors"
          />
        )}
        <input
          className={cn(
            'w-full rounded-xl border bg-white/[0.04] text-white',
            'placeholder-slate-500',
            'border-white/[0.08]',
            'focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
            'focus:bg-white/[0.06]',
            'transition-all duration-300',
            'backdrop-blur-sm',
            Icon ? 'pl-11 pr-4' : 'px-4',
            'py-3 text-sm',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {/* Focus glow */}
        <div className="absolute inset-0 -z-10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 bg-indigo-500/5 blur-xl" />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
