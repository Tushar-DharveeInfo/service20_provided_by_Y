
import { ISession } from "../../context/allinterface/ISession";

// get session variable from storage data 
const FnGetSessionVariableFromStorage = (VariableContext: string = "", VariableName: string = "", sessionData?: ISession[]) => {

    if (sessionData && sessionData.length > 0) {
        return sessionData.filter((ele) => { return ele.VariableContext === (VariableContext && VariableContext !== "" ? VariableContext : ele.VariableContext) && ele.VariableName === (VariableName && VariableName !== "" ? VariableName : ele.VariableName) });
    }
    else {
        return null;
    }
};

export { FnGetSessionVariableFromStorage }