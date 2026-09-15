import { Check, ChevronDown, Times } from "@primeicons/react";
import { Select as PRSelect } from "primereact/select";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <Dropdown/> flat-prop API
// (value/options/optionLabel/optionValue/onChange(e)->e.value/placeholder/showClear/filter)
// working unchanged, backed by v11's compound Select.Root/Trigger/Value/Popup/List API.
// This is the app's permanent internal Select — call sites never touch v11's raw compound
// JSX. `multiple` also covers what used to be a separate <MultiSelect/>.
export function Select({
  value,
  options = [],
  optionLabel = "label",
  optionValue,
  onChange,
  placeholder,
  showClear = false,
  filter = false,
  disabled = false,
  multiple = false,
  className,
  valueTemplate,
  itemTemplate,
  ...rest
}) {
  return (
    <PRSelect.Root
      value={value}
      options={options}
      optionLabel={optionLabel}
      optionValue={optionValue}
      disabled={disabled}
      multiple={multiple}
      filter={filter}
      onValueChange={(e) => onChange?.({ value: e.value, originalEvent: e.originalEvent })}
      className={cn(
        "group inline-flex cursor-pointer relative select-none rounded-md border border-surface-300 hover:border-surface-400 focus-within:border-primary! data-disabled:bg-surface-100 data-disabled:text-surface-400 data-disabled:pointer-events-none bg-surface-0 text-sm transition-colors",
        className
      )}
      {...rest}
    >
      <PRSelect.Trigger className="flex items-center w-full outline-none cursor-pointer py-1.5 px-2.5">
        <PRSelect.Value className="block whitespace-nowrap overflow-hidden flex-auto w-[1%] text-ellipsis text-left bg-transparent border-none outline-none data-placeholder:text-surface-400 text-surface-700" placeholder={placeholder}>
          {valueTemplate
            ? (instance) => {
                const selected = options.find((o) => (optionValue ? o[optionValue] : o.value) === instance.select?.state?.value);
                return valueTemplate(selected, instance);
              }
            : undefined}
        </PRSelect.Value>
        {showClear && (
          <PRSelect.Clear className="text-surface-400 hover:text-surface-600 shrink-0 mr-1">
            <Times className="size-3.5" />
          </PRSelect.Clear>
        )}
        <PRSelect.Indicator className="flex items-center justify-center shrink-0 bg-transparent text-surface-400 w-6">
          <ChevronDown className="size-3.5" />
        </PRSelect.Indicator>
      </PRSelect.Trigger>
      <PRSelect.Portal>
        <PRSelect.Positioner>
          <PRSelect.Popup className="rounded-md min-w-(--px-positioner-anchor-width) bg-surface-0 border border-surface-200 text-surface-700 shadow-md origin-(--px-transform-origin) data-enter-from:opacity-0 data-enter-from:scale-95 data-leave-to:opacity-0 data-leave-to:scale-95 transition-[opacity,scale] duration-150 ease-out">
            {filter && (
              <PRSelect.Header className="p-2">
                <PRSelect.Filter
                  placeholder="Search..."
                  className="w-full rounded-md outline-hidden bg-surface-0 text-sm border border-surface-300 focus:border-primary px-2.5 py-1.5"
                />
              </PRSelect.Header>
            )}
            <PRSelect.List className="m-0 p-1 list-none space-y-0.5 overflow-auto max-h-(--px-available-height)">
              {(instance) =>
                instance.options?.map((option, index) => {
                  const label = itemTemplate ? itemTemplate(option) : instance.listbox?.getOptionLabel(option);
                  return (
                    <PRSelect.Option
                      key={index}
                      index={index}
                      className="whitespace-nowrap relative flex items-center gap-2 px-2.5 py-1.5 border-none text-sm select-none cursor-pointer rounded-sm data-focused:bg-surface-100 data-selected:bg-primary-50 data-selected:text-primary-700 text-surface-700 transition-colors"
                    >
                      <PRSelect.OptionIndicator className="relative flex items-center justify-center opacity-0 data-selected:opacity-100">
                        <Check className="size-3.5" />
                      </PRSelect.OptionIndicator>
                      {label}
                    </PRSelect.Option>
                  );
                })
              }
            </PRSelect.List>
            <PRSelect.Empty className="px-3 py-2 text-sm text-surface-400">No results found</PRSelect.Empty>
          </PRSelect.Popup>
        </PRSelect.Positioner>
      </PRSelect.Portal>
    </PRSelect.Root>
  );
}

export default Select;
