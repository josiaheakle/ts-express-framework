
import * as Mysql from "mysql";
import * as Express from "express";

import { Database } from "./Database";

const bcrypt = require('bcrypt');

interface ModelProprety {
    value?      : any,
    columnName? : string,
    rules?      : Array<string | {[index:string]:string}>
}

interface RuleError {
    property : string,
    rule     : string,
    message  : string
}

// Be sure to validate and sanitize before sending to Model
/**
 * Abstract Model
 * ---
 * When extending from this class, create each property as a public named as `property_${propertyName}` 
 */
abstract class Model {
    [index:string]:any

    abstract _tableName  : string;

    public loadBody (request : Express.Request) {

        const propNames = this._getPropertyNames();

        propNames.forEach(prop => {
            if(request.body[prop]) {
                this[`property_${prop}`] = request.body[prop];
            }
        });
    }

    public async checkRules () {
        const errors : Array<RuleError> = [];

        for (const prop of this._getPropertyNames()) {
            if (this[this._convertPropToClassName(prop)].rules) {
                for (const rule of this[this._convertPropToClassName(prop)].rules) {
                    if (typeof (rule) === 'string') {
                        // if rule is a string
                        if (! (await this[`_${rule}Rule`](prop))) errors.push({
                            property : prop,
                            rule     : rule,
                            message  : this._getErrorMessage(rule)
                        })
                    } else {
                        // if rule is an object
                        if (! (await this[`_${Object.keys(rule)[0]}Rule`](prop, Object.values(rule)[0]))) errors.push({
                            property : prop,
                            rule : Object.keys(rule)[0],
                            message : this._getErrorMessage(Object.keys(rule)[0])
                        });

                    }

                }
            }
        }

        return errors;
    }

    public async save() : Promise<string|number> {
        let columns : Array<string> = [];
        let values  : Array<any>    = [];
        
        this.properties.forEach((prop) => {
            if(prop.columnName) {
                columns.push(prop.columnName);
                values.push(prop.value);
            }
        });

        let SQL = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (? ${", ?".repeat((values.length -1))})`;
    
        return new Promise((res, rej) => {
            Database.conn.query(SQL, values, (error : Mysql.MysqlError, results : {[index:string]:any}) => {
                console.log(`RESULT`);
                console.log(results);
                if(error) rej (error);
                res(results.insertId);
            });
        });
    }

    public async getById ( id : string|number ) {
        let SQL = `SELECT * FROM ${this.tableName} WHERE id=? `;
        return new Promise((res, rej) => {
            Database.conn.query(SQL, id, (error : Mysql.MysqlError, results : {[index:string]:any}) => {
                if(error) res (false);
                else res(results[0]);
            });
        });

    }
    
    private async _uniqueRule ( propertyName : string ) : Promise<boolean> {
        const property = this._getPropertyByName(propertyName);
        let SQL = `SELECT * FROM ${this.tableName} WHERE ${property.columnName}=? `;

        return new Promise((res, rej) => {
            Database.conn.query(SQL, property.value, (error : Mysql.MysqlError, results : {[index:string]:any}) => {
                if(error || results.length > 0) res(false);
                else res(true);
            });
        });
    }

    private async _passwordRule ( propertyName : string ) : Promise<boolean> {
        const property = this._getPropertyByName(propertyName);
        return new Promise((res, rej) => {
            bcrypt.hash(property.value, 10, (err, hash) => {
                if (err) res (false);
                else {
                    property.value = hash;
                    res(true);
                }
            });
        });
    }

    private _getErrorMessage ( rule : string ) : string {
        switch(rule) {
            case (`unique`):
                return `Already in use.`
                break;
        }
    }

    private _getPropertyByName ( propertyName : string ) : ModelProprety {
        return this[this._convertPropToClassName(propertyName)];
    }

    private _getPropertyNames () : Array<string> {
        let propNames = Object.getOwnPropertyNames(this).filter((propName : string) => propName.includes('property'));
        propNames = propNames.map((prop) => {
            return prop.replace('property_', '');
        });
        return propNames;
    }

    private _convertPropToClassName (propertyName : string) : string {
        return `property_${propertyName}`;
    }

}


export type {ModelProprety, RuleError};
export {Model};