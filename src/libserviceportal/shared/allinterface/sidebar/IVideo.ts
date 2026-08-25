import { INote } from "@n20a/libavnotes";

interface IVideo {
    noteProps: INote
    sendNotes: (message: INote) => void;
    handleClose: () => void;
}
export type { IVideo }