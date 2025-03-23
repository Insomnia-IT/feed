import React, { FC } from 'react';
import css from './scanner-comment.module.css';
import { Text } from '~/shared/ui/typography';

interface ScannerCommentProps {
    text: string;
}

export const ScannerComment: FC<ScannerCommentProps> = ({ text }) => (
    <div className={css.scannerComment}>
        <Text className={css.text}>❗{text}</Text>
    </div>
);
