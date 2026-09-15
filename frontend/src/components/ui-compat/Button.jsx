import { Button as PRButton } from "@/components/ui/button";
import { Spinner } from "@primeicons/react";
import { resolveIcon } from "@/icons/registry";

const SEVERITY_ALIASES = { warning: "warn" };

// Compatibility wrapper: keeps the old PrimeReact v10 <Button/> flat-prop API
// (label/icon="pi pi-x"/loading/text/outlined/rounded/severity="warning"/tooltip)
// working unchanged — v11's Button is a bare unstyled primitive with no label/icon/
// loading concept at all (it just renders whatever children you give it), so those
// need to be composed here rather than being a real prop diff to fix per call site.
export function Button({
  label,
  icon,
  loading = false,
  text = false,
  outlined = false,
  link = false,
  severity,
  tooltip,
  className,
  children,
  ...rest
}) {
  const variant = link ? "link" : text ? "text" : outlined ? "outlined" : "default";
  const normalizedSeverity = SEVERITY_ALIASES[severity] || severity;
  const Icon = loading ? Spinner : resolveIcon(icon);
  const iconOnly = !!(icon || loading) && !label && !children;

  return (
    <PRButton variant={variant} severity={normalizedSeverity} iconOnly={iconOnly} className={className} title={tooltip} {...rest}>
      {Icon && <Icon className={loading ? "animate-spin" : undefined} />}
      {label}
      {children}
    </PRButton>
  );
}

export default Button;
