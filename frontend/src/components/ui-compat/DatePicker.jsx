import { Calendar as CalendarIcon } from "@primeicons/react";
import { DatePicker as PRDatePicker } from "primereact/datepicker";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <Calendar/> flat-prop API
// (value/onChange(e)->e.value/placeholder/showIcon/dateFormat) working unchanged,
// backed by v11's compound DatePicker.Root/Input/Popup/Calendar API.
export function DatePicker({ value, onChange, placeholder, showIcon = false, dateFormat, className, ...rest }) {
  return (
    <PRDatePicker.Root
      value={value}
      dateFormat={dateFormat}
      onValueChange={(e) => onChange?.({ value: e.value, originalEvent: e.originalEvent })}
      className={cn("relative inline-flex items-center", className)}
      {...rest}
    >
      <PRDatePicker.Input
        placeholder={placeholder}
        className="w-full rounded-md border border-surface-300 hover:border-surface-400 focus:border-primary! bg-surface-0 text-sm text-surface-700 placeholder:text-surface-400 py-1.5 px-2.5 outline-none transition-colors"
      />
      {showIcon && <CalendarIcon className="size-3.5 text-surface-400 absolute right-2.5 pointer-events-none" />}
      <PRDatePicker.Portal>
        <PRDatePicker.Positioner>
          <PRDatePicker.Popup className="rounded-md bg-surface-0 border border-surface-200 text-surface-700 shadow-md p-2 data-enter-from:opacity-0 data-enter-from:scale-95 data-leave-to:opacity-0 data-leave-to:scale-95 transition-[opacity,scale] duration-150 ease-out">
            <PRDatePicker.Panel>
              <PRDatePicker.Calendar />
            </PRDatePicker.Panel>
          </PRDatePicker.Popup>
        </PRDatePicker.Positioner>
      </PRDatePicker.Portal>
    </PRDatePicker.Root>
  );
}

export default DatePicker;
