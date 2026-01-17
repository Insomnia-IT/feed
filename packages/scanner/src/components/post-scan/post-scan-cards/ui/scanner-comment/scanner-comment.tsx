import type { FC } from 'react';
import cn from 'classnames';

import { Text } from 'shared/ui/typography';

import css from './scanner-comment.module.css';

interface ScannerCommentProps {
    text: string;
    variant?: 'white' | 'red';
}

export const ScannerComment: FC<ScannerCommentProps> = ({ text, variant = 'red' }) => (
    <div className={cn(css.scannerComment, css[variant])}>
        <Text className={css.text}>
            <span className={css.exclamation}>!</span>
            {text}
        </Text>
    </div>
);
