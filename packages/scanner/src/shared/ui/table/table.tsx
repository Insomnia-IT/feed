import React from 'react';
import cn from 'classnames';

import { Text } from '~/shared/ui/typography';

import css from './table.module.css';
export const Table = ({
    children,
    className = '',
    ...restProps
}: React.ComponentProps<'table'>): React.ReactElement => {
    return (
        <table className={cn(css.table, { [className]: !!className })} {...restProps}>
            {children}
        </table>
    );
};
export const THead = ({
    children,
    className = '',
    ...restProps
}: React.ComponentProps<'thead'>): React.ReactElement => {
    return (
        <thead className={cn(css.thead, { [className]: !!className })} {...restProps}>
            {children}
        </thead>
    );
};
export const TBody = ({
    children,
    className = '',
    ...restProps
}: React.ComponentProps<'tbody'>): React.ReactElement => {
    return (
        <tbody className={cn(css.tbody, { [className]: !!className })} {...restProps}>
            {children}
        </tbody>
    );
};
export const Row = ({ children, className = '', ...restProps }: React.ComponentProps<'tr'>): React.ReactElement => {
    return (
        <tr className={cn(css.row, { [className]: !!className })} {...restProps}>
            {children}
        </tr>
    );
};
export const HeadCell = ({
    children,
    className = '',
    ...restProps
}: React.ComponentProps<'th'>): React.ReactElement => {
    return (
        <th className={cn(css.head, { [className]: !!className })} {...restProps}>
            {children}
        </th>
    );
};
export const Cell = ({ children, className = '', ...restProps }: React.ComponentProps<'td'>): React.ReactElement => {
    return (
        <td className={cn(css.cell, { [className]: !!className })} {...restProps}>
            {children}
        </td>
    );
};
