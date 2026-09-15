'use client';;
import { cn } from '@/lib/utils';
import { Times } from '@primeicons/react';
import { cva } from 'class-variance-authority';
import { Message as PRMessage, useMessageContext } from 'primereact/message';
import * as React from 'react';

const messageVariants = cva('rounded-md outline outline-1', {
    variants: {
        variant: {
            default: '',
            outlined: 'bg-transparent outline outline-1',
            simple: 'bg-transparent outline-none **:data-[part=content]:p-0'
        },
        severity: {
            info: '',
            success: '',
            warn: '',
            error: '',
            secondary: '',
            contrast: ''
        },
        size: {
            small: `**:data-[part=content]:px-2 **:data-[part=content]:py-1
                [&_[data-part=icon]_svg]:size-3.5!
                **:data-[part=text]:text-xs
                **:data-[part=close-icon]:w-3.5 **:data-[part=close-icon]:h-3.5 **:data-[part=close-icon]:text-sm`,
            normal: `**:data-[part=content]:px-2.5 **:data-[part=content]:py-1.5
                [&_[data-part=icon]_svg]:size-4!
                **:data-[part=text]:text-sm`,
            large: `**:data-[part=content]:px-3 **:data-[part=content]:py-2
                [&_[data-part=icon]_svg]:size-4.5!
                **:data-[part=text]:text-base
                **:data-[part=close-icon]:w-4.5 **:data-[part=close-icon]:h-4.5 **:data-[part=close-icon]:text-xl`
        }
    },
    defaultVariants: {
        variant: 'default',
        severity: 'info',
        size: 'normal'
    },
    compoundVariants: [
        // Default variant
        {
            variant: 'default',
            severity: 'info',
            className: 'bg-blue-50/95 outline-blue-200 text-blue-600 dark:bg-blue-500/15 dark:outline-blue-700/35 dark:text-blue-500'
        },
        {
            variant: 'default',
            severity: 'success',
            className: 'bg-green-50/95 outline-green-200 text-green-600 dark:bg-green-500/15 dark:outline-green-700/35 dark:text-green-500'
        },
        {
            variant: 'default',
            severity: 'warn',
            className: 'bg-yellow-50/95 outline-yellow-200 text-yellow-600 dark:bg-yellow-500/15 dark:outline-yellow-700/35 dark:text-yellow-500'
        },
        {
            variant: 'default',
            severity: 'error',
            className: 'bg-red-50/95 outline-red-200 text-red-600 dark:bg-red-500/15 dark:outline-red-700/35 dark:text-red-500'
        },
        {
            variant: 'default',
            severity: 'secondary',
            className: 'bg-surface-100 outline-surface-200 text-surface-600 dark:bg-surface-800 dark:outline-surface-700 dark:text-surface-300'
        },
        {
            variant: 'default',
            severity: 'contrast',
            className: 'bg-surface-900 outline-surface-950 text-surface-50 dark:bg-surface-0 dark:outline-surface-100 dark:text-surface-950'
        },
        // Outlined variant
        {
            variant: 'outlined',
            severity: 'info',
            className: 'text-blue-600 outline-blue-600 dark:text-blue-500 dark:outline-blue-500'
        },
        {
            variant: 'outlined',
            severity: 'success',
            className: 'text-green-600 outline-green-600 dark:text-green-500 dark:outline-green-500'
        },
        {
            variant: 'outlined',
            severity: 'warn',
            className: 'text-yellow-600 outline-yellow-600 dark:text-yellow-500 dark:outline-yellow-500'
        },
        {
            variant: 'outlined',
            severity: 'error',
            className: 'text-red-600 outline-red-600 dark:text-red-500 dark:outline-red-500'
        },
        {
            variant: 'outlined',
            severity: 'secondary',
            className: 'text-surface-500 outline-surface-500 dark:text-surface-400 dark:outline-surface-400'
        },
        {
            variant: 'outlined',
            severity: 'contrast',
            className: 'text-surface-950 outline-surface-950 dark:text-surface-0 dark:outline-surface-0'
        },
        // Simple variant
        {
            variant: 'simple',
            severity: 'info',
            className: 'text-blue-600 dark:text-blue-500'
        },
        {
            variant: 'simple',
            severity: 'success',
            className: 'text-green-600 dark:text-green-500'
        },
        {
            variant: 'simple',
            severity: 'warn',
            className: 'text-yellow-600 dark:text-yellow-500'
        },
        {
            variant: 'simple',
            severity: 'error',
            className: 'text-red-600 dark:text-red-500'
        },
        {
            variant: 'simple',
            severity: 'secondary',
            className: 'text-surface-500 dark:text-surface-400'
        },
        {
            variant: 'simple',
            severity: 'contrast',
            className: 'text-surface-950 dark:text-surface-0'
        }
    ]
});

const closeVariants = cva(
    `flex items-center justify-center shrink-0 ms-auto overflow-hidden relative cursor-pointer select-none
    w-6 h-6 rounded-full bg-transparent transition-colors duration-200 text-inherit p-0 border-none
    focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2`,
    {
        variants: {
            variant: {
                default: '',
                outlined: 'hover:bg-transparent!',
                simple: 'hover:bg-transparent!'
            },
            severity: {
                info: 'hover:bg-blue-100 focus-visible:outline-blue-600 dark:hover:bg-white/5 dark:focus-visible:outline-blue-500',
                success: 'hover:bg-green-100 focus-visible:outline-green-600 dark:hover:bg-white/5 dark:focus-visible:outline-green-500',
                warn: 'hover:bg-yellow-100 focus-visible:outline-yellow-600 dark:hover:bg-white/5 dark:focus-visible:outline-yellow-500',
                error: 'hover:bg-red-100 focus-visible:outline-red-600 dark:hover:bg-white/5 dark:focus-visible:outline-red-500',
                secondary: 'hover:bg-surface-200 focus-visible:outline-surface-600 dark:hover:bg-surface-700 dark:focus-visible:outline-surface-300',
                contrast: 'hover:bg-surface-800 focus-visible:outline-surface-50 dark:hover:bg-surface-100 dark:focus-visible:outline-surface-950'
            }
        },
        defaultVariants: {
            variant: 'default',
            severity: 'info'
        }
    }
);

function Message({
    className,
    severity = 'info',
    variant,
    size,
    ...props
}) {
    return (
        <PRMessage.Root
            severity={severity}
            variant={variant}
            size={size}
            className={cn(messageVariants(
                { variant: variant ?? 'default', severity, size: size ?? 'normal', className }
            ))}
            {...props} />
    );
}

function MessageContent({
    className,
    ...props
}) {
    return <PRMessage.Content className={cn('flex items-center gap-2 h-full', className)} {...props} />;
}

function MessageIcon({
    className,
    ...props
}) {
    return (
        <PRMessage.Icon
            className={cn('shrink-0 text-lg inline-flex items-center justify-center', className)}
            {...props} />
    );
}

function MessageText({
    className,
    ...props
}) {
    return <PRMessage.Text className={cn('text-sm font-medium', className)} {...props} />;
}

function MessageClose({
    className,
    children,
    ...props
}) {
    const message = useMessageContext();
    const severity = (message?.props.severity ?? 'info');
    const variant = message?.props.variant ?? 'default';

    return (
        <PRMessage.Close
            className={cn(closeVariants({ variant, severity, className }))}
            {...props}>
            {children ?? <Times className="w-4 h-4 text-base" />}
        </PRMessage.Close>
    );
}

export { Message, MessageClose, MessageContent, MessageIcon, MessageText, messageVariants };
