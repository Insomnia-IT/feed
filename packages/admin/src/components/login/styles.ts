import type { CSSProperties } from 'react';

export const layoutStyles: CSSProperties = {
    background: '#041428',
    backgroundSize: 'cover'
};

export const containerStyles: CSSProperties = {
    maxWidth: '408px',
    margin: 'auto',
    display: 'flex',
    gap: '14px',
    flexDirection: 'column'
};

export const titleStyles: CSSProperties = {
    textAlign: 'center',
    margin: '0',
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
    minHeight: '360px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

export const qrFormStyles: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '6px'
};

export const authContainerStyles: CSSProperties = {
    width: '90%',
    margin: 'auto',
    padding: '14px'
};
