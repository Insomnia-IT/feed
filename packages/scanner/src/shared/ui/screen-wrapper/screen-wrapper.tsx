import React from 'react';

import css from './screen-wrapper.module.css';
export const ScreenWrapper = ({ children }) => {
    return <div className={css.screen}>{children}</div>;
};
