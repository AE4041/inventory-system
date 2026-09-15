import { resolveIcon } from "../icons/registry";
import BrandMark from "../components/BrandMark";

const FEATURES = [
  { icon: "pi-building-columns", text: "Run every branch from one dashboard" },
  { icon: "pi-shopping-cart", text: "Fast, simple point-of-sale checkout" },
  { icon: "pi-chart-line", text: "Real-time sales, expenses & inventory reports" },
];

// Shared branded shell for the login/register screens — a value-proposition panel on
// larger screens, collapsing to just the form (with a small brand header) on mobile.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative flex-col justify-between p-12 text-white overflow-hidden shrink-0"
        style={{ background: "linear-gradient(160deg, #7c3aed, #5b21b6 60%, #4c1d95)" }}
      >
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.12), transparent)" }}
        />
        <div
          className="absolute -left-16 bottom-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.08), transparent)" }}
        />

        <div className="relative flex items-center gap-3">
          <BrandMark size={40} />
          <span className="text-lg font-semibold">Multi-Store Inventory &amp; POS</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-semibold leading-snug mb-6">Run every branch from one place.</h2>
          <ul className="space-y-4">
            {FEATURES.map((f) => {
              const Icon = resolveIcon(f.icon);
              return (
                <li key={f.text} className="flex items-center gap-3 text-white/90">
                  <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    {Icon && <Icon className="text-sm" />}
                  </span>
                  <span className="text-sm">{f.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">&copy; {new Date().getFullYear()} &middot; Built for small &amp; growing retail teams</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <BrandMark size={32} />
            <span className="font-semibold text-gray-900">InvenPOS</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-xl font-bold text-gray-900 text-center">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 text-center mt-1 mb-6">{subtitle}</p>}
            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
