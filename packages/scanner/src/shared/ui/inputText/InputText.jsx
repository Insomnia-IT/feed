// import React, { useState } from 'react';
//
// import styles from './inputText.module.scss';
//
// const InputText = ({ errorStatusMsg, handleChangeInput, id, label, name, value }) => {
//     const { msg, status } = errorStatusMsg;
//
//     return (
//         <div className={styles.formItem}>
//             {label && (
//                 <label htmlFor={id} className={styles.formLabel}>
//                     {label}
//                 </label>
//             )}
//             <input
//                 id={id}
//                 name={name}
//                 type='text'
//                 value={value}
//                 className={`${styles.formInput} ${status && styles.error} `}
//                 onChange={handleChangeInput}
//                 autoComplete='off'
//             />
//             {status && <span className={styles.alertMessage}>{msg}</span>}
//         </div>
//     );
// };
//
// export default InputText;
