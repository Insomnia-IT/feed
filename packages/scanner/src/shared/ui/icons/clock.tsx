import React from 'react';

import { IconContainer } from 'shared/ui/icon-container/icon-container';

interface ChevronDownProps {
    color?: string;
    className?: string;
}

export const Clock = (props: ChevronDownProps): React.ReactElement => {
    const { className, color = 'black' } = props;

    return (
        <IconContainer className={className}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
            >
                <defs>
                    <clipPath id="clip4_496">
                        <rect id="clock" width="100%" height="100%" fill="white" fillOpacity="0" />
                    </clipPath>
                </defs>
                <g clipPath="url(#clip4_496)">
                    <path
                        id="Icon (Stroke)"
                        d="M12 4C7.58154 4 4 7.58179 4 12C4 16.4182 7.58154 20 12 20C16.4185 20 20 16.4182 20 12C20 7.58179 16.4185 4 12 4ZM2 12C2 6.47705 6.47705 2 12 2C17.5229 2 22 6.47705 22 12C22 17.5229 17.5229 22 12 22C6.47705 22 2 17.5229 2 12ZM12 6C12.5522 6 13 6.44775 13 7L13 11.4338L15.0146 12.6426C15.4883 12.9268 15.6416 13.541 15.3574 14.0144C15.0732 14.488 14.459 14.6416 13.9854 14.3574L11.4854 12.8574C11.1841 12.6768 11 12.3513 11 12L11 7C11 6.44775 11.4478 6 12 6Z"
                        fill={color}
                        fillOpacity="1.000000"
                        fillRule="evenodd"
                    />
                </g>
            </svg>
        </IconContainer>
    );
};
