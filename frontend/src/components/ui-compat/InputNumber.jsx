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
        <PRInputNumber.Decrement className="inline-flex items-center justify-center px-2 rounded-l-md border border-r-0 border-surface-300 dark:border-gray-600 bg-surface-50 dark:bg-gray-700 hover:bg-surface-100 dark:hover:bg-gray-600 text-surface-500 dark:text-gray-300">
          <ChevronDown className="size-3.5" />
        </PRInputNumber.Decrement>
      )}
      <PRInputNumber.Input
        placeholder={placeholder}
        className={cn(
          "rounded-md border border-surface-300 dark:border-gray-600 hover:border-surface-400 dark:hover:border-gray-500 focus-visible:border-primary! bg-surface-0 dark:bg-gray-800 text-sm text-surface-700 dark:text-gray-200 py-1.5 px-2.5 outline-none transition-colors",
          showButtons && buttonLayout === "horizontal" && "rounded-none text-center flex-auto",
          inputClassName
        )}
      />
      {showButtons && buttonLayout === "horizontal" && (
        <PRInputNumber.Increment className="inline-flex items-center justify-center px-2 rounded-r-md border border-l-0 border-surface-300 dark:border-gray-600 bg-surface-50 dark:bg-gray-700 hover:bg-surface-100 dark:hover:bg-gray-600 text-surface-500 dark:text-gray-300">
          <ChevronUp className="size-3.5" />
        </PRInputNumber.Increment>
      )}
    </PRInputNumber.Root>
  );
}

export default InputNumber;
