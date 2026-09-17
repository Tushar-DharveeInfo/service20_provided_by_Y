
import { useState, createContext, useMemo, useCallback } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { ISession, ISessionContextProps } from "../allinterface/ISession";

const SessionContext = createContext<ISessionContextProps | undefined>(undefined);

function SessionProvider({ children }: IAppContextWrapper) {
  const [sessionList, setSessionList] = useState<ISession[]>([]);

  const UpdateRowName = useCallback((row: ISession) => {
    try {
      setSessionList((prevList) =>
        prevList.map((thisRow) => {
          if (
            thisRow.VariableName === row.VariableName &&
            thisRow.VariableContext === row.VariableContext
          ) {
            return { ...thisRow, SessionValue: row.SessionValue };
          }
          return thisRow;
        })
      );
    } catch (error) {
      console.error("Error updating session row:", error);
    }
  }, []);

  const FnAvailableSessionVariables = useCallback(() => {
    return sessionList;
  }, [sessionList]);



  const contextValue = useMemo(() => ({
    SessionList: sessionList,
    UpdateRowName,
    setSessionList,
    FnAvailableSessionVariables,
  }), [sessionList, UpdateRowName, FnAvailableSessionVariables]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export { SessionProvider, SessionContext };
