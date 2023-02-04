import type { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler): void => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        void import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
            getCLS(onPerfEntry);
            getFID(onPerfEntry);
            getFCP(onPerfEntry);
            getLCP(onPerfEntry);
            getTTFB(onPerfEntry);
        });
    }
};

// eslint-disable-next-line import/no-default-export
export default reportWebVitals;
