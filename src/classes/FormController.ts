import * as Express from "express";
import * as ExpressValidator from "express-validator";

import { Form, InputProperty } from "./Form";
import { RuleError } from "./Model";

interface FormControllerInput {
    name            : string, 
    value           : string|number,
    errors          : Array<string>,
    inputProperty   : InputProperty
}

class FormController {
    [index:string]:any

    public form   : Form;
    public inputs : Array<FormControllerInput>;

    constructor (form : Form) {
        this.form = form;
        this.inputs = [];
        form.inputs.forEach((input, index) => {
            this.inputs[index] = {
                name            : input.name,
                value           : '',
                errors          : [],
                inputProperty   : input 
            }
        });
    }

    public updateValues (req : Express.Request) {
        this._clearErrors();
        this.inputs.forEach (input => {
            input.value = req.body[input.name] ?? '';
        });
    }

    public updateValidationErrors (errors : Array<ExpressValidator.ValidationError>) {


        errors.forEach(error => {
            this.inputs.forEach((input) => {
                if(error['param'] === input.name && !input.errors.includes(error['msg'])) {
                    input.errors.push(error['msg']);
                }
            });
        });

    }

    public updateModelErrors ( modelErrors : Array<RuleError> ) {
        
        modelErrors.forEach(error => {
            this.inputs.forEach(input => {
                if (input.name === error.property && !input.errors.includes(error.message)) input.errors.push(error.message);
            })
        });
    }

    public addError (propertyName : string, error : string) {
        const prop = this.inputs.find(i => i.name === propertyName);
        if (!prop.errors.includes(error)) prop.errors.push(error);
    }

    public hasError () {
        return this.inputs.some(i => {
            if (i.errors.length > 0) return true;
        });
    }

    private _clearErrors () {
        this.inputs.forEach(input => {
            input.errors = [];
        });
    } 

}

export {
    FormController,
    FormControllerInput
}