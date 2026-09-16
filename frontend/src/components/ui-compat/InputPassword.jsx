import { useState } from "react";
import { Eye, EyeSlash } from "@primeicons/react";
import { InputPassword as PRInputPassword } from "primereact/inputpassword";
import { cn } from "@/lib/utils";

// Compatibility wrapper: keeps the old PrimeReact v10 <Password/> flat-prop API
// (value/onChange/toggleMask/feedback/inputClassName) working unchanged. v11's
// InputPassword is a flat masked <input> with no built-in reveal button (that's an
// exposed imperative method, not a rendered toggle), so the eye icon is hand-built here.
export function InputPassword({ toggleMask = false, feedback, className, inputClassName, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <PRInputPassword
        type={toggleMask && visible ? "text" : "password"}
        className={cn(
          "w-full rounded-md border border-surface-300 dark:border-gray-600 hover:border-surface-400 dark:hover:border-gray-500 focus-visible:border-primary! bg-surface-0 dark:bg-gray-800 text-sm text-surface-700 dark:text-gray-200 py-1.5 px-2.5 outline-none transition-colors",
          toggleMask && "pe-9",
          inputClassName
        )}
        {...rest}
      />
      {toggleMask && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-surface-400 dark:text-gray-500 hover:text-surface-600 dark:hover:text-gray-300"
        >
          {visible ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

export default InputPassword;
