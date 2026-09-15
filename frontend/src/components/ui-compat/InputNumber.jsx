import { ChevronDown, ChevronUp } from "@primeicons/react";
import { InputNumber as PRInputNumber } from "primereact/inputnumber";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <InputNumber/> flat-prop API
// (value/onValueChange/min/max/mode/suffix/showButtons/buttonLayout/inputClassName)
// working unchanged, backed by v11's compound InputNumber.Root/Input/Increment/Decrement.
export function InputNumber({
  value,
  onValueChange,
  min,
  max,
  mode,
  suffix,
  prefix,
  minFractionDigits,
  maxFractionDigits,
  placeholder,
  showButtons = false,
  buttonLayout = "horizontal",
  className,
  inputClassName,
  disabled,
  // Absorbed v10 per-button styling hooks — dropped, not forwarded (no v11 equivalent).
  decrementButtonClassName: _decrementButtonClassName,
  incrementButtonClassName: _incrementButtonClassName,
  ...rest
}) {
  return (
    <PRInputNumber.Root
      value={value}
      min={min}
      max={max}
      mode={mode}
      suffix={suffix}
      prefix={prefix}
      minFractionDigits={minFractionDigits}
      maxFractionDigits={maxFractionDigits}
      disabled={disabled}
      layout={showButtons ? buttonLayout : undefined}
      onValueChange={(e) => onValueChange?.({ value: e.value })}
      className={cn("inline-flex relative isolate", showButtons && buttonLayout === "horizontal" && "items-stretch", className)}
      {...rest}
    >
      {showButtons && buttonLayout === "horizontal" && (
        <PRInputNumber.Decrement className="inline-flex items-center justify-center px-2 rounded-l-md border border-r-0 border-surface-300 bg-surface-50 hover:bg-surface-100 text-surface-500">
          <ChevronDown className="size-3.5" />
        </PRInputNumber.Decrement>
      )}
      <PRInputNumber.Input
        placeholder={placeholder}
        className={cn(
          "rounded-md border border-surface-300 hover:border-surface-400 focus-visible:border-primary! bg-surface-0 text-sm text-surface-700 py-1.5 px-2.5 outline-none transition-colors",
          showButtons && buttonLayout === "horizontal" && "rounded-none text-center flex-auto",
          inputClassName
        )}
      />
      {showButtons && buttonLayout === "horizontal" && (
        <PRInputNumber.Increment className="inline-flex items-center justify-center px-2 rounded-r-md border border-l-0 border-surface-300 bg-surface-50 hover:bg-surface-100 text-surface-500">
          <ChevronUp className="size-3.5" />
        </PRInputNumber.Increment>
      )}
    </PRInputNumber.Root>
  );
}

export default InputNumber;
