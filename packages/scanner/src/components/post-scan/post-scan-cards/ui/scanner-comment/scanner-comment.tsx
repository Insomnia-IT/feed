import type { FC } from 'react';
import React from 'react';

import { Text } from '~/shared/ui/typography';

import css from './scanner-comment.module.css';

interface ScannerCommentProps {
    text: string;
}

export const ScannerComment: FC<ScannerCommentProps> = ({ text }) => (
    <div className={css.scannerComment}>
        <Text className={css.text}>❗{text}</Text>
    </div>
);
