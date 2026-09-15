import { ToggleButton as PRToggleButton } from "@/components/ui/togglebutton";

// Compatibility wrapper: keeps the old PrimeReact v10 <ToggleButton checked onChange
// onLabel offLabel/> API working unchanged — v11 renamed checked/onChange to
// pressed/onPressedChange (event carries `.pressed`, not `.value`) and dropped the
// onLabel/offLabel convenience entirely (it just renders children now).
export function ToggleButton({ checked, onChange, onLabel = "On", offLabel = "Off", className }) {
  return (
    <PRToggleButton pressed={checked} onPressedChange={(e) => onChange?.({ value: e.pressed })} className={className}>
      {checked ? onLabel : offLabel}
    </PRToggleButton>
  );
}

export default ToggleButton;
