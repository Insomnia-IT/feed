import React from 'react';
import cn from 'classnames';

import css from './table.module.css';
export const Table = ({ className = '', ...restProps }: React.ComponentProps<'table'>): React.ReactElement => {
    return <table className={cn(css.table, { [className]: !!className })} {...restProps}></table>;
};
export const Thead = ({ className = '', ...restProps }: React.ComponentProps<'thead'>): React.ReactElement => {
    return <thead className={cn(css.thead, { [className]: !!className })} {...restProps}></thead>;
};
export const TBody = ({ className = '', ...restProps }: React.ComponentProps<'tbody'>): React.ReactElement => {
    return <thead className={cn(css.tbody, { [className]: !!className })} {...restProps}></thead>;
};
export const Row = ({ className = '', ...restProps }: React.ComponentProps<'tr'>): React.ReactElement => {
    return <tr className={cn(css.row, { [className]: !!className })} {...restProps}></tr>;
};
export const HeadCell = ({ className = '', ...restProps }: React.ComponentProps<'th'>): React.ReactElement => {
    return <th className={cn(css.head, { [className]: !!className })} {...restProps}></th>;
};
export const Cell = ({ className = '', ...restProps }: React.ComponentProps<'td'>): React.ReactElement => {
    return <td className={cn(css.cell, { [className]: !!className })} {...restProps}></td>;
};
