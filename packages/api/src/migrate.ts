import { AppDataSource } from './datasource';

AppDataSource.connect().then(async (connection) => {
    // await connection.query(`PRAGMA foreign_keys=OFF`);
    // const foo = await connection.query(`PRAGMA foreign_keys`);
    // const foo = await connection.query(`PRAGMA compile_options;`);
    // console.log(foo);
    await connection.runMigrations();
    // await connection.query(`PRAGMA foreign_keys=ON`);
});
