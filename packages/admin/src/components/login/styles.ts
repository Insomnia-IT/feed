import type { CSSProperties } from 'react';

export const layoutStyles: CSSProperties = {
    background: '#041428',
    backgroundSize: 'cover'
};

export const containerStyles: CSSProperties = {
    maxWidth: '408px',
    margin: 'auto'
};

export const titleStyles: CSSProperties = {
    textAlign: 'center',
    margin: 0,
    color: 'white',
    fontWeight: 400
};

export const imageContainer: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '8px'
};

export const loginFormStyles: CSSProperties = {
    minHeight: '390px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

export const qrFormStyles: CSSProperties = {
    width: '100%',
    minHeight: '390px'
};
