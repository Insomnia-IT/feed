import { Grid } from 'antd';

export const useIsMobile = (): { isMobile: boolean } => {
    const breakpoint = Grid.useBreakpoint();

    const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

    return { isMobile };
};
