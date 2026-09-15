'use client';;
import { cn } from '@/lib/utils';
import { Skeleton as PRSkeleton } from 'primereact/skeleton';
import * as React from 'react';

function Skeleton({
    className,
    shape = 'rectangle',
    ...props
}) {
    return (
        <PRSkeleton
            shape={shape}
            className={cn(
                'overflow-hidden bg-surface-200 dark:bg-surface-700 animate-pulse',
                shape === 'circle' ? 'rounded-full' : 'rounded-md',
                className
            )}
            {...props} />
    );
}

export { Skeleton };
