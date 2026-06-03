export type BaseFeedTypeCode = 'FREE' | 'PAID';

/** Исключение бесплатное, если базовый тип — платный, и наоборот. */
export function getExceptionIsFree(baseFeedTypeCode: BaseFeedTypeCode): boolean {
    return baseFeedTypeCode === 'PAID';
}

export function getFeedExceptionCopy(baseFeedTypeCode: BaseFeedTypeCode) {
    if (baseFeedTypeCode === 'FREE') {
        return {
            sectionTitle: 'Исключения',
            sectionTooltip: 'Базовое питание бесплатное. Ниже задаются периоды, когда волонтёр питается платно.',
            hint: 'Базовое питание бесплатное. Укажите даты, когда волонтёр питается платно.',
            addButton: 'Добавить исключение',
            intervalTitle: (index: number) => `Исключение ${index + 1} (Кормить платно)`,
            overlapError: 'Периоды исключений не должны пересекаться'
        };
    }

    return {
        sectionTitle: 'Исключения',
        sectionTooltip:
            'Базовое питание платное. Ниже задаются периоды, когда волонтёр питается бесплатно за счёт фестиваля.',
        hint: 'Базовое питание платное. Укажите даты, когда волонтёр питается бесплатно за счёт фестиваля.',
        addButton: 'Добавить исключение',
        intervalTitle: (index: number) => `Исключение ${index + 1} (Кормить бесплатно)`,
        overlapError: 'Периоды исключений не должны пересекаться'
    };
}
