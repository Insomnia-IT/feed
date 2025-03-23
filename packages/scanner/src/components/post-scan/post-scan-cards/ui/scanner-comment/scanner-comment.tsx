import React, { FC } from 'react';
import css from './scanner-comment.module.css';
import { Text } from '~/shared/ui/typography';
import cn from 'classnames';

interface ScannerCommentProps {
    text: string;
    color?: 'red' | 'white';
}

export const ScannerComment: FC<ScannerCommentProps> = ({ color = 'red', text }) => {
    const textColor = color === 'white' ? 'white' : undefined;

    return (
        <div className={cn(css.scannerComment, { [css[color]]: color })}>
            <Text className={css.text} color={textColor}>
                ❗{text}
            </Text>
        </div>
    );
};
