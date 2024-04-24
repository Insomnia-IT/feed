// import React from "react";
// import styles from "./mainInput.module.scss";
// import { classNames } from "../../../../helpers/ClassNames/ClassNames";
//
// export const MainInputThemes = {
//     clear: "clear",
// };
//
// const MainInput = (props) => {
//     const {
//         theme,
//         error = false,
//         errorText,
//         blue,
//         orange,
//         ...restProps
//     } = props;
//
//     const getColorClass = () => {
//         if (orange) return styles.orange;
//         if (blue) return styles.blue;
//         return "";
//     };
//
//     const mods = {
//         [styles[theme]]: Boolean(theme),
//     };
//
//     return (
//         <>
//             <input
//                 {...restProps}
//                 className={classNames(`${styles.input} ${error ? styles.error : ''}`, mods, [
//                     getColorClass(),
//                     props.className,
//                 ])}
//             >
//                 {props.children}
//             </input>
//             {error && errorText && <p className={styles.errorP}>{errorText}</p>}
//         </>
//     );
// };
//
// export default MainInput;
