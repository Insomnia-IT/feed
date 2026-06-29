export type VolunteerPhotoFieldLayout = {
    offsetTop: number;
    spanHeight: number;
};

export const measureVolunteerPhotoFieldLayout = (fieldsNode: HTMLDivElement): VolunteerPhotoFieldLayout | null => {
    const fieldsRect = fieldsNode.getBoundingClientRect();
    const firstLabel = fieldsNode.querySelector<HTMLElement>(
        '[data-vol-field-anchor="badge-label"] .ant-form-item-label'
    );
    const bottomControl = fieldsNode.querySelector<HTMLElement>(
        '[data-vol-field-anchor="name-row-end"] .ant-form-item-control-input'
    );

    if (!firstLabel || !bottomControl) {
        return null;
    }

    const offsetTop = firstLabel.getBoundingClientRect().top - fieldsRect.top;
    const spanBottom = bottomControl.getBoundingClientRect().bottom - fieldsRect.top;

    return {
        offsetTop: Math.round(offsetTop),
        spanHeight: Math.round(spanBottom - offsetTop)
    };
};
