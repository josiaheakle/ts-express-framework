import * as ExpressValidator from "express-validator";
import * as Express from "express";
import { RuleError } from "./Model";

interface InputProperty {

    id            : string,
    name          : string, 
    type          : string, 
    displayString : string,
    required?     : boolean

}

class Form {

    public inputs : Array<InputProperty>;
    public action : string;

    constructor( inputs : Array<InputProperty>, action? : string ) {
        this.inputs = inputs;
        this.action = action || '';
        this.setInitValues();
    }

    private setInitValues () {
        this.inputs.forEach(i => {
            if (!i.required) i.required = false;
        });
    }

}

export {
    InputProperty,
    Form
}