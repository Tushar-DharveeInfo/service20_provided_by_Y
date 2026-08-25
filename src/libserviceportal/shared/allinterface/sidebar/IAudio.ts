import { INote } from "@n20a/libavnotes";

interface IAudio {
    noteProps: INote
    handleClose: () => void;
}

export type { IAudio }