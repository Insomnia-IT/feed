import { Form } from 'antd';

import commonStyles from '../common.module.css';
import { SupervisorField } from './supervisor-field';
import { ResponsibleOne } from './responsible-one';
import ResponsibleFor from './responsible-for';
import connectionsStyles from './connections.module.css';

const Connections = () => {
    const form = Form.useFormInstance();

    return (
        <div className={connectionsStyles.connectionsWrap}>
            <section className={commonStyles.formSection}>
                <SupervisorField form={form} />
            </section>
            <section className={commonStyles.formSection}>
                <ResponsibleOne form={form} />
            </section>
            <section className={commonStyles.formSection}>
                <ResponsibleFor />
            </section>
        </div>
    );
};

export default Connections;
