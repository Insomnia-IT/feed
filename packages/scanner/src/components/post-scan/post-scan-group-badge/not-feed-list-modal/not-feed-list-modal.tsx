import { useState } from 'react';

import { Button } from 'shared/ui/button';
import type { ValidatedVol } from 'components/post-scan/post-scan-group-badge/post-scan-group-badge.lib';
import { Modal } from 'shared/ui/modal';
import { Text } from 'shared/ui/typography';

import styles from './not-feed-list-modal.module.css';

export const NotFeedListModalTrigger: React.FC<{ doNotFeedVols: Array<ValidatedVol> }> = ({ doNotFeedVols }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button className={styles.trigger} onClick={() => setIsOpen(true)}>
                Без порции: {doNotFeedVols.length}
            </Button>
            <NoFeedListModal doNotFeedVols={doNotFeedVols} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

const NoFeedListModal: React.FC<{ isOpen: boolean; onClose: () => void; doNotFeedVols: Array<ValidatedVol> }> = ({
    doNotFeedVols,
    isOpen,
    onClose
}) => {
    return (
        <Modal active={isOpen} onClose={onClose} title={'Они не едят:'} classModal={styles.modal}>
            <div className={styles.body}>
                {doNotFeedVols.map((el, index) => (
                    <div key={el.id + '-' + index} className={styles.item}>
                        <Text>{el.name}</Text>
                        <Text style={{ color: 'grey' }}>{el.msg.join(', ')}</Text>
                    </div>
                ))}
            </div>
            <Button onClick={onClose}>Закрыть</Button>
        </Modal>
    );
};
