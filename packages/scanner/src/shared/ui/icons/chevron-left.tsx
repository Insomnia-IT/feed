import React from 'react';

import { IconContainer } from '~/shared/ui/icon-container/icon-container';

interface ChevronDownProps {
    color?: string;
    className?: string;
}

export const ChevronLeft = (props: ChevronDownProps): React.ReactElement => {
    const { className, color = 'black' } = props;

    return (
        <IconContainer className={className}>
            <svg
                width='100%'
                height='100%'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                xmlnsXlink='http://www.w3.org/1999/xlink'
            >
                <defs>
                    <clipPath id='clip4_822'>
                        <rect id='chevron-left' width='24.000000' height='24.000000' fill='white' fillOpacity='0' />
                    </clipPath>
                </defs>
                <g clipPath='url(#clip4_822)'>
                    <path
                        id='Icon'
                        d='M15 6L9 12L15 18'
                        stroke={color}
                        strokeOpacity='1.000000'
                        strokeWidth='2.000000'
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                </g>
            </svg>
        </IconContainer>
    );
};
