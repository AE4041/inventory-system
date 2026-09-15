'use client';

import { cn } from '@/lib/utils';
import { Drawer as PRDrawer } from 'primereact/drawer';
import * as React from 'react';

function Drawer({
    ...props
}) {
    return <PRDrawer.Root {...props} />;
}

function DrawerTrigger({
    ...props
}) {
    return <PRDrawer.Trigger {...props} />;
}

function DrawerBackdrop({
    className,
    ...props
}) {
    return (
        <PRDrawer.Backdrop
            className={cn(
                'fixed inset-0 bg-black/50 opacity-100 data-enter-from:opacity-0 data-leave-to:opacity-0 transition-opacity duration-150 ease-out',
                className
            )}
            {...props} />
    );
}

function DrawerPortal({
    ...props
}) {
    return <PRDrawer.Portal {...props} />;
}

function DrawerPopup({
    className,
    ...props
}) {
    return (
        <PRDrawer.Popup
            className={cn(`fixed z-50 flex flex-col
            border border-surface-200 dark:border-surface-700
            bg-surface-0 dark:bg-surface-900
            text-surface-700 dark:text-surface-0 shadow-lg
            data-[position=left]:top-0 data-[position=left]:inset-s-0 data-[position=left]:h-full data-[position=left]:border-e
            data-[position=right]:top-0 data-[position=right]:inset-e-0 data-[position=right]:h-full data-[position=right]:border-s
            data-[position=top]:top-0 data-[position=top]:inset-s-0 data-[position=top]:w-full data-[position=top]:border-b
            data-[position=bottom]:bottom-0 data-[position=bottom]:inset-s-0 data-[position=bottom]:w-full data-[position=bottom]:border-t
            data-[position=full]:inset-0 data-[position=full]:w-screen! data-[position=full]:h-screen! data-[position=full]:max-h-full data-[position=full]:border
            data-enter-from:opacity-0
            data-[position=left]:data-enter-from:-translate-x-full
            data-[position=left]:data-leave-to:-translate-x-full
            data-[position=right]:data-enter-from:translate-x-full
            data-[position=right]:data-leave-to:translate-x-full
            data-[position=top]:data-enter-from:-translate-y-full
            data-[position=top]:data-leave-to:-translate-y-full
            data-[position=bottom]:data-enter-from:translate-y-full
            data-[position=bottom]:data-leave-to:translate-y-full
            data-[position=full]:data-enter-from:scale-75
            data-[position=full]:data-leave-to:scale-75
            data-leave-to:opacity-0
            transition-all duration-300 ease-out`, className)}
            {...props} />
    );
}

function DrawerHeader({
    className,
    ...props
}) {
    return (
        <PRDrawer.Header
            className={cn('flex items-center justify-between shrink-0 p-5', className)}
            {...props} />
    );
}

function DrawerTitle({
    className,
    ...props
}) {
    return <PRDrawer.Title className={cn('font-semibold text-lg', className)} {...props} />;
}

function DrawerClose({
    className,
    ...props
}) {
    return (
        <PRDrawer.Close
            className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors',
                className
            )}
            {...props} />
    );
}

function DrawerContent({
    className,
    ...props
}) {
    return (
        <PRDrawer.Content
            className={cn('overflow-y-auto grow pt-0 px-5 pb-5', className)}
            {...props} />
    );
}

function DrawerFooter({
    className,
    ...props
}) {
    return (
        <PRDrawer.Footer
            className={cn('shrink-0 pt-0 px-5 pb-5 flex justify-end gap-1.5', className)}
            {...props} />
    );
}

export { Drawer, DrawerBackdrop, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerPopup, DrawerPortal, DrawerTitle, DrawerTrigger };
