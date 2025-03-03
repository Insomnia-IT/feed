export const getVolunteerCountText = (count: number) => {
    return `Вы выбрали ${count} ${count % 10 === 1 ? 'волонтера' : 'волонтеров'}`;
};
