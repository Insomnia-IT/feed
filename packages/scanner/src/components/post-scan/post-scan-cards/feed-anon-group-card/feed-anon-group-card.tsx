import cn from 'classnames';
import { type SubmitEvent, useState } from 'react';

import { CardContainer } from 'components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from 'shared/ui/button/button';
import { Text, Title } from 'shared/ui/typography';
import { VolAndUpdateInfo } from 'components/vol-and-update-info';
import { TextArea } from 'shared/ui/text-area';
import { Input } from 'shared/ui/input';
import { removeNonDigits } from 'shared/lib/utils';
import { useValid } from 'components/post-scan/post-scan-cards/feed-anon-group-card/utils/useValid';
import { massFeedAnons } from 'components/post-scan/post-scan.utils';
import { useApp } from 'model/app-provider';

import css from './feed-anon-group-card.module.css';

export type Form = {
    meat: string;
    vegan: string;
    comment: string;
};

export const FeedAnonGroupCard = ({ close }: { close: () => void }) => {
    const { kitchenId, mealTime } = useApp();
    const [form, setForm] = useState<Form>({
        meat: '',
        vegan: '',
        comment: ''
    });

    const { errors, validate } = useValid(form);

    const changeForm = (change: Partial<Form>): void => {
        setForm((prev) => ({ ...prev, ...change }));
    };

    const feedAnons = async () => {
        await massFeedAnons({
            nonVegansCount: Number(form.meat),
            vegansCount: Number(form.vegan),
            kitchenId,
            mealTime,
            comment: form.comment || undefined
        });
        close();
    };

    const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { valid } = validate();
        if (valid) {
            void feedAnons();
        }
    };
    return (
        <CardContainer className={css.cardContainer}>
            <div className={css.head}>
                <Title>Покормить без бейджа?</Title>
                <Text>
                    Кормить группу можно <b>только по запросу руководителя (Проверяйте бейдж!)</b>
                </Text>
            </div>
            <div className={css.content}>
                <form className={css.form} id="anon-group" onSubmit={handleSubmit}>
                    <div className={css.counts}>
                        <div className={css.inputs}>
                            <div className={css.formItem}>
                                <Input
                                    className={css.numberInput}
                                    type="number"
                                    value={form.meat}
                                    onChange={(e) =>
                                        changeForm({ meat: removeNonDigits(e.currentTarget.value).slice(0, 3) })
                                    }
                                    placeholder="0"
                                    error={!!errors?.['counts']}
                                ></Input>
                                <label className={css.formLabel}>🥩 Мясоед</label>
                            </div>
                            <div className={css.formItem}>
                                <Input
                                    className={css.numberInput}
                                    type="number"
                                    value={form.vegan}
                                    onChange={(e) =>
                                        changeForm({ vegan: removeNonDigits(e.currentTarget.value).slice(0, 3) })
                                    }
                                    placeholder="0"
                                    error={!!errors?.['counts']}
                                ></Input>
                                <label className={css.formLabel}>🥦 Веган</label>
                            </div>
                        </div>
                        {!!errors?.['counts'] && <p className={css.error}>{errors?.['counts']}</p>}
                    </div>
                    <div className={cn(css.formItem, {}, [css.column])}>
                        <label className={cn(css.formLabel, {}, [css.mini])}>Комментарий</label>
                        <TextArea
                            value={form.comment}
                            placeholder={'Служба, руководитель'}
                            onChange={(e) => changeForm({ comment: e.currentTarget.value })}
                        />
                    </div>
                </form>
            </div>
            <div className={css.bottomBLock}>
                <div className={css.buttonsBlock}>
                    <Button variant="secondary" className={css.button} onClick={close}>
                        Отмена
                    </Button>
                    <Button className={css.button} form="anon-group">
                        Покормить группу
                    </Button>
                </div>
                <VolAndUpdateInfo />
            </div>
        </CardContainer>
    );
};
