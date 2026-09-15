'use client';

import { cn } from '@/lib/utils';
import { Times } from '@primeicons/react/times';
import { Check } from '@primeicons/react/check';
import { ExclamationTriangle } from '@primeicons/react/exclamation-triangle';
import { InfoCircle } from '@primeicons/react/info-circle';
import { Toast as PRToast } from 'primereact/toast';
import { Toaster as PRToaster, toast } from 'primereact/toaster';
import { Button } from '@/components/ui/button';
import * as React from 'react';

function ToasterRoot({
    ...props
}) {
    return <PRToaster.Root {...props} />;
}

function ToasterPortal({
    ...props
}) {
    return <PRToaster.Portal {...props} />;
}

function ToasterRegion({
    className,
    ...props
}) {
    return (
        <PRToaster.Region
            className={cn(`fixed w-75 z-2000
            data-[position=bottom-right]:right-8 data-[position=bottom-right]:bottom-8
            data-[position=bottom-center]:bottom-8 data-[position=bottom-center]:left-1/2 data-[position=bottom-center]:-translate-x-1/2
            data-[position=bottom-left]:left-8 data-[position=bottom-left]:bottom-8
            data-[position=top-right]:right-8 data-[position=top-right]:top-8
            data-[position=top-center]:top-8 data-[position=top-center]:left-1/2 data-[position=top-center]:-translate-x-1/2
            data-[position=top-left]:left-8 data-[position=top-left]:top-8`, className)}
            {...props} />
    );
}

function ToastRoot({
    className,
    ...props
}) {
    return (
        <PRToast.Root
            className={cn(// layout & appearance
            `w-full p-4 rounded-lg outline-none absolute touch-none
            bg-surface-0 dark:bg-surface-900
            border border-surface-200 dark:border-surface-800
            text-surface-900 dark:text-surface-0
            shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05)]
            focus-visible:outline-1 focus-visible:outline-surface-950 dark:focus-visible:outline-surface-0 focus-visible:outline-offset-2`, // position based on parent region
            `in-data-[position=bottom-right]:[--px-raise-factor:-1] in-data-[position=bottom-right]:bottom-0 in-data-[position=bottom-right]:right-0
            in-data-[position=bottom-center]:[--px-raise-factor:-1] in-data-[position=bottom-center]:bottom-0
            in-data-[position=bottom-left]:[--px-raise-factor:-1] in-data-[position=bottom-left]:bottom-0 in-data-[position=bottom-left]:left-0
            in-data-[position=top-right]:[--px-raise-factor:1] in-data-[position=top-right]:top-0 in-data-[position=top-right]:right-0
            in-data-[position=top-center]:[--px-raise-factor:1] in-data-[position=top-center]:top-0
            in-data-[position=top-left]:[--px-raise-factor:1] in-data-[position=top-left]:top-0 in-data-[position=top-left]:left-0`, // css custom properties
            `[--px-offset-y:calc(var(--px-swipe-amount-y)+(var(--px-toast-offset)+var(--px-toast-index)*var(--px-gap))*var(--px-raise-factor))]
            [--px-offset-x:var(--px-swipe-amount-x)]`, // base animation state
            `opacity-0
            z-(--px-toast-z-index)
            transform-[translateX(var(--px-offset-x))_translateY(calc(100%*var(--px-raise-factor)*-1))]
            [transition:transform_0.3s,opacity_0.3s,height_0.3s]`, // mounted
            `data-mounted:opacity-100
            data-mounted:transform-[translateY(0)]`, // collapsed stack (not expanded, not front)
            `not-data-expanded:not-data-front:overflow-hidden
            not-data-expanded:not-data-front:h-(--px-front-toast-height)
            not-data-expanded:not-data-front:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-raise-factor)*var(--px-toast-index)*var(--px-gap)))_scale(calc(var(--px-toast-index)*-0.05+1))]`, // expanded
            `data-mounted:data-expanded:h-(--px-initial-height)
            data-mounted:data-expanded:transform-[translateX(var(--px-offset-x))_translateY(var(--px-offset-y))]`, // expanded gap area
            `data-expanded:after:content-[''] data-expanded:after:absolute data-expanded:after:left-0 data-expanded:after:w-full data-expanded:after:bottom-full data-expanded:after:h-[calc(var(--px-gap)+1px)]`, // not visible (! to ensure it overrides data-mounted)
            `not-data-visible:opacity-0! not-data-visible:pointer-events-none! not-data-visible:select-none!`, // removed: front toast exit
            `data-removed:data-front:not-data-swipe-out:opacity-0
            data-removed:data-front:not-data-swipe-out:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-raise-factor)*-100%))]`, // removed: non-front expanded exit
            `data-removed:not-data-front:not-data-swipe-out:data-expanded:opacity-0
            data-removed:not-data-front:not-data-swipe-out:data-expanded:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-raise-factor)*var(--px-offset-y)*0.4))]`, // removed: non-front collapsed exit
            `data-removed:not-data-front:not-data-swipe-out:not-data-expanded:opacity-0
            data-removed:not-data-front:not-data-swipe-out:not-data-expanded:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-raise-factor)*40%*-1))]
            data-removed:not-data-front:not-data-swipe-out:not-data-expanded:[transition:transform_500ms,opacity_200ms]`, // swiping
            `data-swiping:[transition:none]!
            data-swiping:transform-[translateX(var(--px-offset-x))_translateY(var(--px-offset-y))]!`, // swiped
            `data-swiped:select-none`, // swipe-out directions
            `data-swipe-out:data-[swipe-direction=up]:opacity-0
            data-swipe-out:data-[swipe-direction=up]:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-offset-y)-100%))]!`, `data-swipe-out:data-[swipe-direction=down]:opacity-0
            data-swipe-out:data-[swipe-direction=down]:transform-[translateX(var(--px-offset-x))_translateY(calc(var(--px-offset-y)+100%))]!`, `data-swipe-out:data-[swipe-direction=left]:opacity-0
            data-swipe-out:data-[swipe-direction=left]:transform-[translateX(calc(var(--px-offset-x)-100%))_translateY(var(--px-offset-y))]!`, `data-swipe-out:data-[swipe-direction=right]:opacity-0
            data-swipe-out:data-[swipe-direction=right]:transform-[translateX(calc(var(--px-offset-x)+100%))_translateY(var(--px-offset-y))]!
            data-swipe-out:data-[swipe-direction=right]:[transition:transform_500ms,opacity_200ms]`, className)}
            {...props} />
    );
}

function ToastContent({
    className,
    ...props
}) {
    return (
        <PRToast.Content
            className={cn('grid grid-cols-[auto_1fr] items-start gap-3', className)}
            {...props} />
    );
}

function ToastMessage({
    className,
    ...props
}) {
    return <PRToast.Message className={cn('', className)} {...props} />;
}

function ToastTitle({
    className,
    ...props
}) {
    return (
        <PRToast.Title
            className={cn('text-sm font-semibold text-surface-800 dark:text-surface-100', className)}
            {...props} />
    );
}

function ToastDescription({
    className,
    ...props
}) {
    return (
        <PRToast.Description
            className={cn('text-sm text-surface-500 dark:text-surface-400', className)}
            {...props} />
    );
}

function ToastIcon({
    className,
    ...props
}) {
    return (
        <PRToast.Icon
            className={cn('text-surface-800 dark:text-surface-100', className)}
            {...props} />
    );
}

function ToastClose({
    className,
    ...props
}) {
    return <PRToast.Close className={cn('', className)} {...props} />;
}

function ToastAction({
    className,
    ...props
}) {
    return <PRToast.Action className={cn('', className)} {...props} />;
}

function Toaster({
    ...props
}) {
    return (
        <ToasterRoot {...props}>
            <ToasterPortal>
                <ToasterRegion>
                    {({
                        toaster
                    }) =>
                        toaster?.toasts.map((t) => (
                            <ToastRoot key={t.id} toast={t}>
                                <ToastContent>
                                    <ToastIcon className="[&>svg]:size-3.5 mt-1" />
                                    <ToastIcon match="success" className="[&>svg]:size-3.5 mt-1">
                                        <Check />
                                    </ToastIcon>
                                    <ToastIcon match="error" className="[&>svg]:size-3.5 mt-1">
                                        <Times />
                                    </ToastIcon>
                                    <ToastIcon match="warn" className="[&>svg]:size-3.5 mt-1">
                                        <ExclamationTriangle />
                                    </ToastIcon>
                                    <ToastIcon match="info" className="[&>svg]:size-3.5 mt-1">
                                        <InfoCircle />
                                    </ToastIcon>
                                    <ToastIcon match="secondary" className="[&>svg]:size-3.5 mt-1">
                                        <InfoCircle />
                                    </ToastIcon>
                                    <ToastIcon match="contrast" className="[&>svg]:size-3.5 mt-1">
                                        <InfoCircle />
                                    </ToastIcon>
                                    <ToastMessage>
                                        <ToastTitle />
                                        <ToastDescription className="mt-1" />
                                        <ToastAction as={Button} size="small" className="mt-3" />
                                    </ToastMessage>
                                </ToastContent>
                                <ToastClose
                                    as={Button}
                                    iconOnly
                                    severity={t.severity}
                                    variant="text"
                                    size="small"
                                    className="absolute top-2 right-2">
                                    <Times />
                                </ToastClose>
                            </ToastRoot>
                        ))
                    }
                </ToasterRegion>
            </ToasterPortal>
        </ToasterRoot>
    );
}

export { toast, Toaster, ToasterPortal, ToasterRegion, ToasterRoot, ToastAction, ToastContent, ToastClose, ToastMessage, ToastDescription, ToastIcon, ToastRoot, ToastTitle };
