import type { ComponentProps } from 'react';
import cn from 'classnames';

import css from './table.module.css';
export const Table = ({ children, className = '', ...restProps }: ComponentProps<'table'>) => {
    return (
        <table className={cn(css.table, { [className]: !!className })} {...restProps}>
            {children}
        </table>
    );
};
export const THead = ({ children, className = '', ...restProps }: ComponentProps<'thead'>) => {
    return (
        <thead className={cn(css.thead, { [className]: !!className })} {...restProps}>
            {children}
        </thead>
    );
};
export const TBody = ({ children, className = '', ...restProps }: ComponentProps<'tbody'>) => {
    return (
        <tbody className={cn(css.tbody, { [className]: !!className })} {...restProps}>
            {children}
        </tbody>
    );
};
export const Row = ({ children, className = '', ...restProps }: ComponentProps<'tr'>) => {
    return (
        <tr className={cn(css.row, { [className]: !!className })} {...restProps}>
            {children}
        </tr>
    );
};
export const HeadCell = ({ children, className = '', ...restProps }: ComponentProps<'th'>) => {
    return (
        <th className={cn(css.head, { [className]: !!className })} {...restProps}>
            {children}
        </th>
    );
};
export const Cell = ({ children, className = '', ...restProps }: ComponentProps<'td'>) => {
    return (
        <td className={cn(css.cell, { [className]: !!className })} {...restProps}>
            {children}
        </td>
    );
};
