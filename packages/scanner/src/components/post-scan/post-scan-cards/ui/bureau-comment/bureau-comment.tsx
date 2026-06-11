import cn from 'classnames';

import { Text } from 'shared/ui/typography';

import { ScannerComment } from '../scanner-comment/scanner-comment';

import css from './bureau-comment.module.css';

interface BureauCommentProps {
    text: string;
    variant?: 'white' | 'red';
}

export const BureauComment = ({ text, variant = 'red' }: BureauCommentProps) => (
    <div className={cn(css.bureauComment, css[variant])}>
        <Text className={css.title}>От Бюро:</Text>
        <ScannerComment text={text} variant={variant} />
    </div>
);
