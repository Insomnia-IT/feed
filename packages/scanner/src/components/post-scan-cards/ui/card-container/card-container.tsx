import css from './card-container.module.css';

export const CardContainer = (props) => {
    const { children } = props;

    return <div className={css.cardContainer}>{children}</div>;
};
