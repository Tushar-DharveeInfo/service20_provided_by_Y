
import { ICellEditorParams } from "ag-grid-community";

const CheckUserPermission = () => {
  let sessionVar: any = sessionStorage.getItem('session_variables')
  if (sessionVar) {
    sessionVar = JSON.parse(sessionVar)
    let returnVal = ""
    const ImpersonatedUserIDVal = sessionVar.filter((ele: any) => {
      return ele.VariableName === "ImpersonatedUserID"
    })

    if (ImpersonatedUserIDVal[0]?.SessionValue === "") {
      const LoginUserRW = sessionVar.filter((ele: any) => {
        return ele.VariableName === "LoginUserRW"
      })
      returnVal = LoginUserRW[0].SessionValue
    } else {
      const ImpersonatedUserRW = sessionVar.filter((ele: any) => {
        return ele.VariableName === "ImpersonatedUserRW"
      })
      returnVal = ImpersonatedUserRW[0]?.SessionValue
    }
    return returnVal
  }
}

const FnCellEditorSelector = (
  params?: ICellEditorParams
) => {
  try {
    if (!params) {
      return undefined;
    }

    // Use AG-Grid default editor
    return undefined;
  } catch (error) {
    console.error("Error in FnCellEditorSelector:", error);

    // Fallback to AG-Grid default editor
    return undefined;
  }
};

export { CheckUserPermission, FnCellEditorSelector }