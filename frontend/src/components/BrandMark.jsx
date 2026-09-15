// Inline version of the app icon (see public/icon-master.svg) so it stays crisp at any
// size and can inherit the surrounding text color context without an extra network request.
export default function BrandMark({ size = 32, rounded = "rounded-[28%]" }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${rounded}`}
      style={{ width: size, height: size, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="white" />
        <rect x="10" y="8" width="4" height="13" rx="1" fill="white" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="white" />
      </svg>
    </span>
  );
}
