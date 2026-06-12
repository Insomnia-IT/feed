import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY } from 'const';

export const readVolunteerCardLegacyUiEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setVolunteerCardLegacyUiEnabled = (enabled: boolean): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (enabled) {
            window.localStorage.setItem(VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY, 'true');
        } else {
            window.localStorage.removeItem(VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY);
        }
    } catch {
        /* empty */
    }

    window.location.reload();
};

/** Применяет `?legacy=1` / `?legacy=0` и убирает параметр из URL. Возвращает true, если инициирован reload. */
export const applyVolunteerCardLegacyUiSearchParam = (search: string): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const params = new URLSearchParams(search);
    const legacy = params.get('legacy');

    if (legacy !== '1' && legacy !== '0') {
        return false;
    }

    const enabled = legacy === '1';
    const current = readVolunteerCardLegacyUiEnabled();
    params.delete('legacy');

    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;

    if (current === enabled) {
        window.history.replaceState(null, '', newUrl);
        return false;
    }

    try {
        if (enabled) {
            window.localStorage.setItem(VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY, 'true');
        } else {
            window.localStorage.removeItem(VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY);
        }
    } catch {
        /* empty */
    }

    window.location.replace(newUrl);
    window.location.reload();
    return true;
};

export const useVolunteerCardLegacyUi = (): boolean => {
    const location = useLocation();
    const [legacyUiEnabled] = useState(readVolunteerCardLegacyUiEnabled);

    useLayoutEffect(() => {
        applyVolunteerCardLegacyUiSearchParam(location.search);
    }, [location.search]);

    return legacyUiEnabled;
};
