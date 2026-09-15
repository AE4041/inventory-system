import { Times } from "@primeicons/react";
import { Dialog as PRDialog } from "primereact/dialog";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <Dialog/> flat-prop API
// (header/visible/onHide/style/className, children as body content) working unchanged,
// backed by v11's compound Dialog.Root/Popup/Header/Content API.
export function Dialog({ header, visible, onHide, style, className, children }) {
  return (
    <PRDialog.Root open={!!visible} onOpenChange={(e) => !e.value && onHide?.()} modal>
      <PRDialog.Portal>
        <PRDialog.Backdrop className="fixed z-50 inset-0 bg-black/50 opacity-100 data-enter-from:opacity-0 data-leave-to:opacity-0 transition-opacity duration-150 ease-out" />
        <PRDialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <PRDialog.Popup
            style={style}
            className={cn(
              "relative flex flex-col max-h-full w-full pointer-events-auto rounded-2xl border border-surface-200 bg-surface-0 text-surface-700 shadow-lg opacity-100 scale-100 data-enter-from:opacity-0 data-enter-from:scale-95 data-leave-to:opacity-0 data-leave-to:scale-95 transition-[opacity,scale] duration-150 ease-out",
              className
            )}
          >
            {header && (
              <PRDialog.Header className="flex items-center justify-between shrink-0 px-5 pt-5 pb-3">
                <PRDialog.Title className="font-semibold text-base">{header}</PRDialog.Title>
                <PRDialog.Close className="w-8 h-8 rounded-full flex items-center justify-center text-surface-400 hover:bg-surface-100 transition-colors">
                  <Times className="size-4" />
                </PRDialog.Close>
              </PRDialog.Header>
            )}
            <PRDialog.Content className="overflow-y-auto px-5 pb-5">{children}</PRDialog.Content>
          </PRDialog.Popup>
        </PRDialog.Positioner>
      </PRDialog.Portal>
    </PRDialog.Root>
  );
}

export default Dialog;
