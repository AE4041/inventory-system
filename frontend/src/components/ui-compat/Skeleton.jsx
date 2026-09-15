import { Skeleton as PRSkeleton } from "@/components/ui/skeleton";

// Compatibility wrapper: v10's <Skeleton width height size borderRadius/> convenience
// props just set inline styles — v11 dropped all of them except `shape`, so translate
// them into a style object here instead of touching call sites.
export function Skeleton({ shape = "rectangle", width, height, size, borderRadius, style, className }) {
  return (
    <PRSkeleton
      shape={shape}
      className={className}
      style={{
        width: size || width,
        height: size || height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export default Skeleton;
