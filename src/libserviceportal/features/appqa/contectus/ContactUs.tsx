
import { useCallback, useEffect, useMemo, useState } from "react"
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown.ts';
import { Notes } from "@n20a/libavnotes"
import type { INote } from "@n20a/libavnotes"
import { Delete24x24, Info24x24 } from "@n20a/libicon"
import './AppQaContactUs.css'
import '../../../shared/sidebar/notes/FqaNotes.css'
import '@n20a/libavnotes/style.css'
import { Label } from "../../../shared/basic/label/Label.tsx"
import { FnGetCssVariable } from "../../../shared/allcommon/FnGetCssVariable.ts"
import { Image } from "../../../shared/basic/image/Image.tsx"
import type { ITreeNode } from "../../../shared/allinterface/entity/ITreeNode.ts"
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts"
import { FilterKeywordControl } from "../../../shared/searchfilter/filterkeywordcontrol/FilterKeywordControl.tsx"
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage.tsx"
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx"
import type { IImage } from "../../../shared/allinterface/basic/IImage.ts"
import { useBusinessNotes } from "@n20a/libfsdb"
import type { INoteDoc } from "@n20a/libfsdb"
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks.ts"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks.ts"

interface IContactUsNotes {
    uniqueName: string;
    selectedNode: ITreeNode;
    onSelectNote?: (item: Record<string, any>) => void;
    selectedNoteItem?: Record<string, any> | null;
    isAppQa?: boolean
}
interface IContactUs {
    uniqueName: string;
    headerText: string;
    handleShowUserMessage?: (messageText: string) => void;
}

/**
 * Converts a Firestore Timestamp object  { seconds, nanoseconds }
 * OR a plain ISO string into a standard ISO-8601 string.
 * Returns "" when the input is missing or unrecognisable.
 */
function resolveFirestoreDate(value: unknown): string {
    if (!value) return "";
    // Plain ISO string (e.g. optimistic rows we create locally)
    if (typeof value === "string") return value;
    // Firestore Timestamp serialised as { seconds, nanoseconds, type? }
    if (typeof value === "object") {
        const ts = value as Record<string, unknown>;
        const seconds = typeof ts.seconds === "number" ? ts.seconds : Number(ts.seconds ?? 0);
        if (!isNaN(seconds) && seconds > 0) {
            return new Date(seconds * 1000).toISOString();
        }
    }
    return "";
}

/*
 * ContactUs notes panel.
 * Uses useBusinessNotes hook for live load / create / edit / delete.
 */
const ContactUsNotes = ({ uniqueName, selectedNode, onSelectNote, selectedNoteItem, isAppQa }: IContactUsNotes) => {
    // ── identity from context ────────────────────────────────────────────────
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? "").trim();
    const cid = String(authSession?.cid ?? "").trim();
    const noteby = authSession?.displayName ?? authSession?.username ?? "unknown";

    // ── notes hook ───────────────────────────────────────────────────────────
    const {
        notes,
        loading,
        error,
        getNotes,
        createNote,
        updateNote,
        deleteNote,
    } = useBusinessNotes(bid);
    console.log('notes', notes)

    // ── sync loader with status bar ───────────────────────────────────────────
    useEffect(() => {
        statusBarContext.setIsLoading(loading);
        return () => {
            statusBarContext.setIsLoading(false);
        };
    }, [loading, statusBarContext]);

    // ── local UI state ───────────────────────────────────────────────────────
    const [notesItems, setNotesItems] = useState<Record<string, any>[]>([]);
    const [originalNotesItems, setOriginalNotesItems] = useState<Record<string, any>[]>([]);
    const [noteDetails, setNoteDetails] = useState<INote>();
    const [searchText, setSearchText] = useState("");
    const [lensDirty, setLensDirty] = useState(false);
    const [deleteItem, setDeleteItem] = useState<Record<string, any> | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [showOkButton, setShowOkButton] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    /** The note card currently loaded into the editor for editing. null = create-new mode. */
    const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

    // ── reset editor to blank new-note state ─────────────────────────────────
    const resetEditor = useCallback(() => {
        setEditingItem(null);
        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId: `${Date.now()}`,
            noteTitle: "",
            notecontent: "",
            notefile: undefined,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
    }, []);

    // ── select a card to edit in the below notes control ──────────────────────
    const handleSelectCardToEdit = useCallback((item: Record<string, any>) => {
        setEditingItem(item);
        const textContent = String(item.NotesMAX ?? item.message ?? "");
        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId: String(item.id ?? item.noteid ?? item._noteid ?? Date.now()),
            noteTitle: "",
            notecontent: textContent,
            notefile: undefined,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
        if (onSelectNote) {
            onSelectNote(item);
        }
    }, [onSelectNote]);

    // ── LOAD: fetch from hook whenever selected node / bid changes ────────────
    useEffect(() => {
        if (!bid) return;
        getNotes()
            .then((fetched) => {
                const rows = Array.isArray(fetched) ? fetched : [];
                setNotesItems(rows);
                setOriginalNotesItems(rows);
                if (rows.length > 0 && onSelectNote && !selectedNoteItem) {
                    onSelectNote(rows[0]);
                }
            })
            .catch((err) => console.error("ContactUsNotes: getNotes failed", err));
        resetEditor();
    }, [selectedNode, bid, resetEditor, onSelectNote]);

    // ── keep local list in sync when hook re-fetches ──────────────────────────
    // NOTE: Guard with Array.isArray — after createNote/deleteNote the hook
    // may set notes to a non-array value (e.g. write result), which would
    // replace the state with a non-iterable and crash .map().
    useEffect(() => {
        if (!Array.isArray(notes)) return;
        setNotesItems(notes);
        setOriginalNotesItems(notes);
    }, [notes]);

    // ── SAVE / UPDATE ─────────────────────────────────────────────────────────
    const sendNotes = useCallback(async (message: INote) => {
        const noteText = message.notecontent?.trim() ?? "";

        if (!noteText) {
            setNoteDetails(message);
            setConfirmMessage(
                "Please enter a note before saving. If you attach a file, audio, or video, include a note describing it."
            );
            setShowOkButton(true);
            setDeleteOpen(true);
            return;
        }

        const now = new Date().toISOString();

        // ── EDIT MODE: If user selected an existing note card, call updateNote ──
        if (editingItem) {
            const noteIdToUpdate = String(
                editingItem.id ?? editingItem.noteid ?? editingItem._noteid ?? ""
            );

            // Optimistic update in local list
            const applyUpdate = (prev: Record<string, any>[]) =>
                prev.map((item) => {
                    const itemId = String(item.id ?? item.noteid ?? item._noteid ?? "");
                    if (item === editingItem || (noteIdToUpdate && itemId === noteIdToUpdate)) {
                        return {
                            ...item,
                            NotesMAX: noteText,
                            message: noteText,
                            LastUpdated: now,
                            monitorupdated: now,
                        };
                    }
                    return item;
                });

            setNotesItems(applyUpdate);
            setOriginalNotesItems(applyUpdate);
            resetEditor();

            if (noteIdToUpdate) {
                const updatePayload = {
                    message: noteText,
                    monitorupdated: now,
                };
                const result = await updateNote(noteIdToUpdate, updatePayload as unknown as Record<string, unknown>);
                if (!result?.success) {
                    console.error("ContactUsNotes: updateNote failed", result?.error);
                }
            }
            return;
        }

        // ── CREATE MODE: Add a new note ──────────────────────────────────────
        let notesType = "Message";
        if (message.notevideo) notesType = "Video";
        else if (message.noteaudio) notesType = "Audio";
        else if (message.notefile) notesType = "Image";

        const noteid = `note_${cid}_${Date.now()}`;

        const notePayload: INoteDoc = {
            bid,
            cid,
            noteid,
            noteby,
            message: noteText,
            filename: notesType !== "Message" ? `file-${Date.now()}` : "",
            datecreated: now,
            monitorupdated: now,
            monitor: false,
        };

        // Optimistic UI row mapped to display shape
        const optimisticRow: Record<string, any> = {
            EntityName: selectedNode.NodeEntityname ?? "ContactUs",
            LastUpdated: now,
            NodeType: selectedNode.NodeType ?? "ContactUs",
            NotesMAX: noteText,
            NotesType: notesType,
            UserName: noteby,
            Status: "Accepted",
            _noteid: noteid,
            ...(notesType !== "Message" ? { FileUID: notePayload.filename } : {}),
        };
        setNotesItems((prev) => [optimisticRow, ...prev]);
        setOriginalNotesItems((prev) => [optimisticRow, ...prev]);
        resetEditor();

        const result = await createNote(notePayload as unknown as Record<string, unknown>);
        if (!result?.success) {
            console.error("ContactUsNotes: createNote failed", result?.error);
        }
    }, [editingItem, resetEditor, updateNote, cid, bid, noteby, selectedNode, createNote]);

    // ── SEARCH ────────────────────────────────────────────────────────────────
    const searchValueChange = (value: string) => {
        setSearchText(value);
        setLensDirty(Boolean(value.length));
        if (!value.length) setNotesItems(originalNotesItems);
    };

    const handleKeywordSearchResult = () => {
        const q = searchText.toLowerCase();
        setNotesItems(
            originalNotesItems.filter((item) =>
                (item.NotesMAX ?? item.message ?? "").toLowerCase().includes(q)
            )
        );
    };

    // ── DELETE ────────────────────────────────────────────────────────────────
    const handleDelete = (item: Record<string, any>) => {
        setDeleteItem(item);
        setConfirmMessage("Are you sure you want to delete this note?");
        setShowOkButton(false);
        setDeleteOpen(true);
    };

    const handleConfirmYesClick = async () => {
        if (deleteItem) {
            const noteid = String(deleteItem.id ?? deleteItem.noteid ?? deleteItem._noteid ?? "");
            setNotesItems((prev) => prev.filter((i) => i !== deleteItem));
            setOriginalNotesItems((prev) => prev.filter((i) => i !== deleteItem));
            if (editingItem === deleteItem) {
                resetEditor();
            }
            if (noteid) {
                const result = await deleteNote(noteid);
                if (!result?.success) {
                    console.error("ContactUsNotes: deleteNote failed", result?.error);
                }
            }
        }
        setDeleteItem(null);
        setDeleteOpen(false);
    };

    const handleDeleteAttachment = (
        _objectType: "file" | "audio" | "video",
        _objectData?: Blob | File
    ) => {
        void _objectType;
        void _objectData;
    };

    // ── delete icon ───────────────────────────────────────────────────────────
    const deleteImage: IImage = {
        uniqueName: `${uniqueName}-delete-icon`,
        source: (
            <Delete24x24
                size={FnGetCssVariable("--image-size-2")}
                fill="none"
                strokeWidth={1}
            />
        ),
        w: "var(--image-size-2)",
        type: "svg",
        tooltip: "Click to Delete",
    };

    // ── guard: no session ─────────────────────────────────────────────────────
    if (!bid) {
        return (
            <div className="nz-node-list-Container" key={uniqueName}>
                <Label uniqueName={`${uniqueName}-no-session`} label="Session not available." />
            </div>
        );
    }

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="nz-node-list-Container" key={uniqueName}>
            {!loading && error && (
                <Label uniqueName={`${uniqueName}-error`} label={`Error: ${error}`} />
            )}

            <div className="nz-notes-list-main-div">
                <div className="nz-notes-list-with-msg-box">

                    {/* Search */}
                    <div className="nz-notes-search">
                        <FilterKeywordControl
                            uniqueName={`${uniqueName}-filter`}
                            filterDirty={lensDirty}
                            searchInputValue={searchText}
                            handleFilterMouse={handleKeywordSearchResult}
                            searchValueChange={searchValueChange}
                            filterIconTooltip="Filter"
                        />
                    </div>

                    {/* Notes list */}
                    <div className="nz-notes-list-scroll">
                        {notesItems.map((item, index) => {
                            const isSelected = editingItem
                                ? editingItem === item || (editingItem.id && item.id === editingItem.id) || (editingItem.noteid && item.noteid === editingItem.noteid)
                                : isAppQa
                                    ? false
                                    : selectedNoteItem
                                        ? (
                                            selectedNoteItem.LastUpdated === item.LastUpdated &&
                                            selectedNoteItem.NotesMAX === item.NotesMAX
                                        )
                                        : index === 0;
                            return (
                                <div
                                    className={`nz-node-list-box ${isSelected ? "nz-node-list-box-selected" : ""}`}
                                    key={`${resolveFirestoreDate(item.LastUpdated ?? item.datecreated) || index}-${index}`}
                                    onClick={() => handleSelectCardToEdit(item)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="nz-node-list-delete">
                                        <ActionImage
                                            image={deleteImage}
                                            w="var(--node_height)"
                                            h="var(--node_height)"
                                            uniqueName={`${uniqueName}-delete-${index}`}
                                            actionCode="delete"
                                            disabled={false}
                                            handleMouse={(e) => {
                                                e?.stopPropagation?.();
                                                handleDelete(item);
                                            }}
                                        />
                                        <div className="nz-note-date">
                                            <Label
                                                uniqueName={`${uniqueName}-date-${index}`}
                                                label={FnConvertDateToUtcOrUtcToDate(
                                                    resolveFirestoreDate(item.LastUpdated ?? item.datecreated),
                                                    false,
                                                    true
                                                )}
                                            />
                                        </div>
                                        <div className="nz-note-user">
                                            <Label
                                                uniqueName={`${uniqueName}-user-${index}`}
                                                label={`${item.UserName ?? item.noteby}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="nz-info-div">
                                        <div className="nz-info-image">
                                            <Image
                                                uniqueName={`${uniqueName}-info-${index}`}
                                                source={
                                                    <Info24x24
                                                        size={FnGetCssVariable("--image-size-1")}
                                                        fill="none"
                                                        strokeWidth={1}
                                                    />
                                                }
                                                w="var(--image-size-2)"
                                                tooltip={item.NotesType ?? "Message"}
                                            />
                                        </div>
                                        <div className="nz-nodes-text">
                                            <Label
                                                uniqueName={`${uniqueName}-note-${index}`}
                                                label={item.NotesMAX ?? item.message ?? ""}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Note editor */}
                    <div className="nz-notes-container">
                        {editingItem && (
                            <button
                                type="button"
                                onClick={resetEditor}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--theme-text-color, #666)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    textDecoration: 'underline',
                                    padding: 0,
                                    position: 'absolute',
                                    marginRight: 12,
                                    right: 0,
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        {noteDetails && (
                            <Notes
                                {...noteDetails}
                                key={refreshToken}
                                allowAudio={false}
                                allowVideo={false}
                                sendNote={sendNotes}
                                sendTooltip={editingItem ? "Update Note" : "Send Note"}
                                handleDelete={handleDeleteAttachment}
                            />
                        )}
                    </div>
                </div>
            </div>

            <YesNoFormContainer
                isOpen={deleteOpen}
                uniqueName={`${uniqueName}-confirm`}
                message={confirmMessage}
                showOkButton={showOkButton}
                handleYesButtonClick={handleConfirmYesClick}
                handleNoButtonClick={() => setDeleteOpen(false)}
                handleOkButtonClick={() => setDeleteOpen(false)}
            />
        </div>
    );
};

const AppQaContactUs = (contactUsProps: IContactUs) => {
    /* Same selected-node shape the sidebar notes expects. */
    const contactUsSelectedNode = useMemo<ITreeNode>(() => ({
        key: "contact-us",
        NodeEntityname: "ContactUs",
        NodeEntID: "CONTACT-US",
        stepNo: 0,
        parentEntID: null,
        NodeState: null,
        Description: "ContactUs",
        title: "ContactUs",
        children: [],
        treetype: "ContactUs",
        Name: "ContactUs",
        Type: "ContactUs",
        icon: null,
        HasChildren: 0,
        NodeType: "ContactUs",
    }), []);

    return (
        <div className="nz-w-100 nz-h-100 nz-contact-us-container" tabIndex={1} onKeyDown={handleContainerKeyDown} key={contactUsProps.uniqueName}>
            <div className='nz-sub-header'>
                <Label uniqueName={`${contactUsProps.uniqueName}-task-header`} label={contactUsProps.headerText} />
            </div>
            <div className="nz-w-100 nz-h-100 nz-contact-us-notes-pane">
                <ContactUsNotes
                    uniqueName={`${contactUsProps.uniqueName}-notes`}
                    selectedNode={contactUsSelectedNode}
                    isAppQa={true}
                />
            </div>
        </div>
    )
}

export { AppQaContactUs, ContactUsNotes }
export default AppQaContactUs
