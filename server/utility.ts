const fs = require('fs');
const pg = require('pg');

export function createPGClient() {
    return new pg.Client({
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        ssl: {
            rejectUnauthorized: false,
        }
    });
}

export function arrsFormat(arrs: any[]): string {
    return arrs.map(arr =>
        `(${arr.map(element => {
            if(element == null || element == undefined) return 'NULL';
            if(typeof element === 'string' || element instanceof String) return `'${element.replace('\'', '\'\'')}'`;
            if(element instanceof Date) return `'${element.toISOString()}'`;
            return element.toString().replace('\'', '\'\'');
        }).join(',')})`
    ).join(',\n');
}

export function formatSQL(path: string, ...args: string[]): string {
    let sql = fs.readFileSync(path, { encoding: 'utf8' });
    args.forEach((arg, idx) => sql = sql.replaceAll('%SQL'+(idx+1), arg));
    return sql;
}

export function log(val: any): void {
    process.stdout.write(`[${new Date(Date.now()).toISOString()}] `);
    console.log(val);
}
