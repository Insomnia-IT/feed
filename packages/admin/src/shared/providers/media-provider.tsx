import React, { useContext, useState } from 'react';

import { useIsomorphicLayoutEffect } from 'shared/hooks/use-isomorphic-layout-effect';

interface IMediaContext {
    isMobile: boolean;
    isDesktop: boolean;
}

const MediaContext = React.createContext<IMediaContext | null>(null);

const IS_SERVER = typeof window === 'undefined';

const MOBILE_QUERY = '(max-width: 576px)';

export const MediaProvider = (props: { children: any }) => {
    const { children } = props;

    const [matches, setMatches] = useState<IMediaContext>({
        isMobile: false,
        isDesktop: true
    });

    const getMatches = (query: string, defaultValue: boolean): boolean => {
        if (IS_SERVER) {
            return defaultValue;
        }
        return window.matchMedia(query).matches;
    };

    function handleMobileChange(): void {
        setMatches({
            ...matches,
            isMobile: getMatches(MOBILE_QUERY, false),
            isDesktop: !getMatches(MOBILE_QUERY, false)
        });
    }

    useIsomorphicLayoutEffect(() => {
        const matchMobileMedia = window.matchMedia(MOBILE_QUERY);

        handleMobileChange();

        matchMobileMedia.addEventListener('change', handleMobileChange);

        return () => {
            matchMobileMedia.removeEventListener('change', handleMobileChange);
        };
    }, []);

    return <MediaContext.Provider value={matches}>{children}</MediaContext.Provider>;
};

export function useMedia(): IMediaContext {
    const context = useContext(MediaContext);
    if (context === null) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
}
