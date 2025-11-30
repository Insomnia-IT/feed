import type { FC } from 'react';
import cn from 'classnames';

import { Text } from 'shared/ui/typography';

import { ScannerComment } from '../scanner-comment/scanner-comment';

import css from './bureau-comment.module.css';

interface BureauCommentProps {
    text: string;
    variant?: 'white' | 'red';
}

export const BureauComment: FC<BureauCommentProps> = ({ text, variant = 'red' }) => (
    <div className={cn(css.bureauComment, css[variant])}>
        <Text className={css.title}>От Бюро:</Text>
        <ScannerComment text={text} variant={variant} />
    </div>
);
