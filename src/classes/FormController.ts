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
    public inputs : {[index:string]:FormControllerInput}

    constructor (form : Form) {
        this.form = form;
        form.inputs.forEach((input) => {
            this.inputs[input.name] = {
                name            : input.name,
                value           : '',
                errors          : [],
                inputProperty   : input 
            }
        });
    }

    public updateValues (req : Express.Request) {
        const inputKeys = Object.keys(this.inputs);
        inputKeys.forEach(iKey => {
            this[iKey].value = req.body[iKey].value ?? '';
        });
    }

    public updateValidationErrors (errors : Array<ExpressValidator.ValidationError>) {
        
        const inputKeys = Object.keys(this.inputs);
        errors.forEach(error => {
            inputKeys.forEach(iKey => {
                this[iKey].errors = [];
                if(error['param'] === iKey && !this[iKey].errors.includes(error['msg'])) {
                    this[iKey].errors.push(error['msg']);
                }
            });
        });
    }

    public updateModelErrors ( modelErrors : Array<RuleError> ) {
        const inputKeys = Object.keys(this.inputs);
        modelErrors.forEach(error => {
            inputKeys.forEach(iKey => {
                if (iKey === error.property && !this[iKey].errors.includes(error.message)) this[iKey].errors.push(error.message);
            })
        });
    }

    public addError (propertyName : string, error : string) {
        if (!this.inputs[propertyName].errors.includes(error)) this.inputs[propertyName].errors.push(error);
    }

    public hasError () {
        const inputKeys = Object.keys(this.inputs);
        return inputKeys.some(i => {
            if (this.inputs[i].errors.length > 0) return true;
        });
    }


}