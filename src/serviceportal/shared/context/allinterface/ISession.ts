
export interface ISession {
  VariableContext: string;
  VariableName: string;
  SessionValue: string | null;
  AllowInReport?: boolean
}

export interface ISessionContextProps {
  SessionList: ISession[],
  UpdateRowName: (row: ISession) => void;
  setSessionList: (SessionList: ISession[]) => void;
  FnAvailableSessionVariables: () => void

}
