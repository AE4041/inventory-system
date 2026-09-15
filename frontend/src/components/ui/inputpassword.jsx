'use client';;
import { inputTextVariants } from '@/components/ui/inputtext';
import { cn } from '@/lib/utils';
import { InputPassword as PRInputPassword } from 'primereact/inputpassword';
import * as React from 'react';

function InputPassword({
    className,
    size,
    variant,
    ...props
}) {
    return (
        <PRInputPassword
            className={cn(inputTextVariants({ size, variant, className }))}
            size={size}
            variant={variant}
            {...props} />
    );
}

export { InputPassword };
