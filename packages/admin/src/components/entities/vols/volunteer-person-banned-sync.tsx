import { useEffect } from 'react';
import { Form } from 'antd';

import type { PersonEntity } from 'interfaces';

const HiddenPersonField = (_props: { value?: PersonEntity | null }) => null;

type VolunteerPersonBannedSyncProps = {
    onBannedChange: (banned: boolean) => void;
};

/**
 * Keeps the page title in sync with person.banned.
 * person is prefilled via setFieldValue in CommonEdit without a visible Form.Item,
 * so useWatch in the Create/Edit title (outside Form) does not re-render.
 */
export const VolunteerPersonBannedSync = ({ onBannedChange }: VolunteerPersonBannedSyncProps) => {
    const form = Form.useFormInstance();
    const personBanned = Form.useWatch((values) => values?.person?.banned === true, form);

    useEffect(() => {
        onBannedChange(Boolean(personBanned));
    }, [onBannedChange, personBanned]);

    return (
        <Form.Item name="person" hidden noStyle preserve>
            <HiddenPersonField />
        </Form.Item>
    );
};
