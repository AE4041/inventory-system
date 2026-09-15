'use client';;
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { Textarea as PRTextarea } from 'primereact/textarea';
import * as React from 'react';

const textareaVariants = cva(`appearance-none rounded-md outline-hidden
text-surface-700 dark:text-surface-0
placeholder:text-surface-500 dark:placeholder:text-surface-400
border border-surface-300 dark:border-surface-700
hover:border-surface-400 dark:hover:border-surface-600
focus-visible:border-primary hover:focus-visible:border-primary-emphasis dark:hover:focus-visible:border-primary-emphasis
disabled:bg-surface-200 disabled:text-surface-500
dark:disabled:bg-surface-700 dark:disabled:text-surface-400
aria-invalid:border-red-400 dark:aria-invalid:border-red-300
aria-invalid:placeholder:text-red-600 dark:aria-invalid:placeholder:text-red-400
transition-colors duration-200 shadow-[0_1px_2px_0_rgba(18,18,23,0.05)]`, {
    variants: {
        variant: {
            outlined: 'bg-surface-0 dark:bg-surface-950',
            filled: 'bg-surface-50 dark:bg-surface-800'
        },
        size: {
            small: 'text-xs px-2 py-1',
            normal: 'text-sm px-2.5 py-1.5',
            large: 'text-base px-3 py-2'
        },
        fluid: {
            true: 'w-full'
        }
    },
    defaultVariants: {
        variant: 'outlined',
        size: 'normal',
        fluid: false
    }
});

function Textarea({
    className,
    variant = 'outlined',
    size,
    invalid,
    fluid = false,
    ...props
}) {
    return (
        <PRTextarea
            size={size}
            variant={variant}
            fluid={fluid}
            invalid={invalid}
            aria-invalid={invalid}
            className={cn(textareaVariants({ variant, size, fluid, className }))}
            {...props} />
    );
}

export { Textarea };
