import type { CSSProperties } from 'react';

export const layoutStyles: CSSProperties = {
    // background: `radial-gradient(50% 50% at 50% 50%, #161B58 0%, #0D1034 100%)`,
    background: '#041428',
    backgroundSize: 'cover'
};

export const containerStyles: CSSProperties = {
    maxWidth: '408px',
    margin: 'auto'
};

export const titleStyles: CSSProperties = {
    textAlign: 'center',
    color: '#1E1E1E',
    // fontSize: '30px',
    // letterSpacing: '-0.04em',
    paddingTop: '24px',
    margin: 0,
};

export const imageContainer: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '28px'
};
