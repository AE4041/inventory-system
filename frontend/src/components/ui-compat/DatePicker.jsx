import { Calendar as CalendarIcon } from "@primeicons/react";
import {
  DatePicker as StyledDatePicker,
  DatePickerInput,
  DatePickerPortal,
  DatePickerPositioner,
  DatePickerPopup,
  DatePickerPanel,
  DatePickerCalendar,
} from "@/components/ui/datepicker";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <Calendar/> flat-prop API
// (value/onChange(e)->e.value/placeholder/showIcon/dateFormat) working unchanged,
// backed by v11's compound DatePicker.Root/Input/Popup/Calendar API. Uses the CLI-generated
// `ui/datepicker.jsx` for the actual popup content — a hand-rolled bare `<Calendar/>` with no
// children renders an empty shell (it's a compound component: Header/Table/TableBody etc. all
// have to be composed explicitly), which is what this wrapper used to do.
export function DatePicker({ value, onChange, placeholder, showIcon = false, dateFormat, className, ...rest }) {
  return (
    <StyledDatePicker
      value={value}
      dateFormat={dateFormat}
      onValueChange={(e) => onChange?.({ value: e.value, originalEvent: e.originalEvent })}
      className={cn("relative inline-flex items-center", className)}
      {...rest}
    >
      <DatePickerInput placeholder={placeholder} />
      {showIcon && <CalendarIcon className="size-3.5 text-surface-400 dark:text-gray-500 absolute right-2.5 pointer-events-none" />}
      <DatePickerPortal>
        <DatePickerPositioner>
          <DatePickerPopup>
            <DatePickerPanel>
              <DatePickerCalendar />
            </DatePickerPanel>
          </DatePickerPopup>
        </DatePickerPositioner>
      </DatePickerPortal>
    </StyledDatePicker>
  );
}

export default DatePicker;
