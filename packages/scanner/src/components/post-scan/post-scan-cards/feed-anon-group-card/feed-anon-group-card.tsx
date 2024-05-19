import type { FC } from 'react';
import cn from 'classnames';
import { useState } from 'react';

import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';
import { TextArea } from '~/shared/ui/text-area';
import { Input } from '~/shared/ui/input';
import { removeNonDigits } from '~/shared/lib/utils';
import { useValid } from '~/components/post-scan/post-scan-cards/feed-anon-group-card/utils/useValid';

import css from './feed-anon-group-card.module.css';

export type Form = {
    meat: number;
    vegan: number;
    comment: string;
};

export const FeedAnonGroupCard: FC<{
    close: () => void;
    doFeed: (isVegan?: boolean, reason?: string) => void;
}> = ({ close, doFeed }) => {
    const [form, setForm] = useState<Form>({
        meat: 0,
        vegan: 0,
        comment: ''
    });

    const { errors, validate } = useValid(form);

    const changeForm = (change): void => {
        setForm((prev) => ({ ...prev, ...change }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { valid } = validate();
        if (valid) {
            for (let i = 0; i < form.vegan; i++) {
                doFeed(true, form.comment);
            }
            for (let i = 0; i < form.meat; i++) {
                doFeed(false, form.comment);
            }
            close();
        }
    };

    return (
        <CardContainer className={css.cardContainer}>
            <div className={css.feedAnonCard}>
                <div className={css.head}>
                    <Title>Покормить без бейджа?</Title>
                    <Text>
                        Кормить группу можно <b>только по запросу руководителя (Проверяйте бейдж!)</b>
                    </Text>
                </div>
                <div className={css.content}>
                    <form className={css.form} id='anon-group' onSubmit={handleSubmit}>
                        <div className={css.counts}>
                            <div className={css.inputs}>
                                <div className={css.formItem}>
                                    <Input
                                        className={css.numberInput}
                                        type='number'
                                        value={form.meat}
                                        onChange={(e) =>
                                            changeForm({ meat: removeNonDigits(e.currentTarget.value).slice(0, 3) })
                                        }
                                        error={!!errors?.['counts']}
                                    ></Input>
                                    <label className={css.formLabel}>🥩 Мясоед</label>
                                </div>
                                <div className={css.formItem}>
                                    <Input
                                        className={css.numberInput}
                                        type='number'
                                        value={form.vegan}
                                        onChange={(e) =>
                                            changeForm({ vegan: removeNonDigits(e.currentTarget.value).slice(0, 3) })
                                        }
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
                        <Button variant='secondary' className={css.button} onClick={close}>
                            Отмена
                        </Button>
                        <Button className={css.button} form='anon-group'>
                            Покормить группу
                        </Button>
                    </div>
                    <VolAndUpdateInfo />
                </div>
            </div>
        </CardContainer>
    );
};
