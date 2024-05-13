import React from 'react';

import { IconContainer } from '~/shared/ui/icon-container/icon-container';

interface ChevronDownProps {
    color?: string;
    className?: string;
}

export const CircleCheck = (props: ChevronDownProps): React.ReactElement => {
    const { className, color = 'black' } = props;

    return (
        <IconContainer className={className}>
            <svg width='100%' height='100%' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path
                    fillRule='evenodd'
                    clipRule='evenodd'
                    d='M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM16.6783 8.2652C17.0841 8.6398 17.1094 9.27246 16.7348 9.67828L11.1963 15.6783C11.007 15.8834 10.7406 16 10.4615 16C10.1824 16 9.91604 15.8834 9.72674 15.6783L7.2652 13.0116C6.89059 12.6058 6.9159 11.9731 7.32172 11.5985C7.72754 11.2239 8.3602 11.2492 8.7348 11.6551L10.4615 13.5257L15.2652 8.32172C15.6398 7.9159 16.2725 7.89059 16.6783 8.2652Z'
                    fill={color}
                />
                <path
                    fillRule='evenodd'
                    clipRule='evenodd'
                    d='M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z'
                    fill={color}
                />
            </svg>
        </IconContainer>
    );
};
