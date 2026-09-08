
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown.ts';
import { Notes } from "@n20a/libavnotes"
import type { INote } from "@n20a/libavnotes"
import { Attach24x24, Delete24x24, Info24x24 } from "@n20a/libicon"
import './AppQaContactUs.css'
import '../../../shared/sidebar/notes/FqaNotes.css'
import '@n20a/libavnotes/style.css'
import { Label } from "../../../shared/basic/label/Label.tsx"
import { FnGetCssVariable } from "../../../shared/allcommon/FnGetCssVariable.ts"
import { Image } from "../../../shared/basic/image/Image.tsx"
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts"
import { FilterKeywordControl } from "../../../shared/searchfilter/filterkeywordcontrol/FilterKeywordControl.tsx"
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx"
import { useBusinessNotes, useFileUpload, useFileDownload, useFileDelete } from "@n20a/libfsdb"
import type { INoteDoc } from "@n20a/libfsdb"
import { CLOUD_BUCKET } from "../../allcommon/FnGetCloudFilePublicUrl.ts"
import { useMainAppContext } from "../../../shared/context/hooks/MainAppHooks.ts"
import { useStatusBarContext } from "../../../shared/context/hooks/StatusBarHooks.ts"
import { IImage } from "../../../shared/allinterface/basic/IImage.ts";
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage.tsx";
import { ITreeNode } from "../../../shared/allinterface/tree/ITreeControl.ts";

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

/**
 * Converts a note document / row into a numeric timestamp for chronological sorting.
 */
function parseNoteDate(item: Record<string, any>): number {
    const rawDate = item.datecreated ?? item.LastUpdated ?? item.monitorupdated;
    if (rawDate != null && rawDate !== '') {
        if (typeof rawDate === 'number') {
            return rawDate;
        }
        if (rawDate instanceof Date) {
            return rawDate.getTime();
        }
        if (typeof rawDate === 'object') {
            if ('toDate' in rawDate && typeof (rawDate as { toDate: () => Date }).toDate === 'function') {
                return (rawDate as { toDate: () => Date }).toDate().getTime();
            }
            if ('seconds' in rawDate && typeof (rawDate as { seconds: number }).seconds === 'number') {
                return (rawDate as { seconds: number }).seconds * 1000;
            }
        }
        if (typeof rawDate === 'string') {
            const parsed = Date.parse(rawDate);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
    }
    // Fallback: extract timestamp from noteid if available (e.g. note_cid_1788857795000)
    const noteId = String(item.id ?? item.noteid ?? item._noteid ?? "");
    const match = noteId.match(/_(\d{10,13})$/);
    if (match) {
        const ts = Number(match[1]);
        if (!isNaN(ts)) return ts;
    }
    return 0;
}

/**
 * Prepares a unique file name prefixed with "{bid}-{cid}-{yymmddhhmmss}".
 */
function generateUniqueFileName(bid: string, cid: string, originalName: string, defaultExt = "png"): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const yymmddhhmmss = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    let cleanName = getCleanFileName(originalName.trim());
    if (!cleanName) {
        cleanName = `attachment.${defaultExt}`;
    } else if (!cleanName.includes(".")) {
        cleanName = `${cleanName}.${defaultExt}`;
    }
    return `${bid}-${cid}-${yymmddhhmmss}-${cleanName}`;
}

/**
 * Strips the "{bid}-{cid}-{yymmddhhmmss}-" prefix to return the original clean file name.
 */
function getCleanFileName(rawName: string): string {
    if (!rawName) return "";
    const base = rawName.split("/").pop() || rawName;
    const match = base.match(/^[^-]+-[^-]+-\d{12}[-_]?(.*)$/);
    return match && match[1] ? match[1] : base;
}

/**
 * Builds the Firebase Cloud Storage path for tickets attachments.
 * Format: ${bucketName}/${baseFolder}/sm/smfiles/tickets/${filename}
 */
function buildStoragePathForTickets(filename: string): string {
    if (!filename) return "";
    if (filename.includes("/")) return filename;
    const cfg = () => (window as Window & { APP_CONFIG?: Record<string, string> }).APP_CONFIG ?? {};
    const c = cfg();
    const baseFolder = c.BASE_FOLDER ?? 'sm';
    const bucketName = c.BUCKET_NAME ?? c.FIREBASE_BUCKET ?? CLOUD_BUCKET ?? 'n20-bucket-01';
    return `${bucketName}/${baseFolder}/smfiles/tickets/${filename}`;
}

/**
 * Reads a Blob/File as pure Base64 (without the "data:<type>;base64," prefix).
 */
function fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result ?? "");
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
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

    // ── firebase storage hooks ───────────────────────────────────────────────
    const { uploadSingleFile, uploadMultipleFiles, uploading, progress, error: uploadError } = useFileUpload();
    const { downloadSingleFile } = useFileDownload();
    const { deleteFiles } = useFileDelete();
    const [fileUploading, setFileUploading] = useState(false);

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
        statusBarContext.setIsLoading(loading || uploading || fileUploading);
        return () => {
            statusBarContext.setIsLoading(false);
        };
    }, [loading, uploading, fileUploading, statusBarContext]);

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // ── auto-scroll to bottom when notes list changes ─────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [notesItems.length]);

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

    // ── download attached file from cloud storage ────────────────────────────
    const handleDownloadFile = useCallback(async (item: Record<string, any>, e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        const rawFileName = String(item.filename || item.FileUID || "").trim();
        if (!rawFileName) return;

        const storagePath = buildStoragePathForTickets(rawFileName);
        statusBarContext.setIsLoading(true);
        try {
            const res = await downloadSingleFile(storagePath);

            const downloadUrl = res?.blobUrl;
            if (downloadUrl) {
                const cleanName = getCleanFileName(rawFileName);
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = cleanName || "download";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error("ContactUsNotes: downloadSingleFile failed", res?.error);
            }
        } catch (err) {
            console.error("ContactUsNotes: handleDownloadFile error", err);
        } finally {
            statusBarContext.setIsLoading(false);
        }
    }, [downloadSingleFile, statusBarContext]);

    // ── select a card to edit in the below notes control ──────────────────────
    const handleSelectCardToEdit = useCallback(async (item: Record<string, any>) => {
        setEditingItem(item);
        const textContent = String(item.NotesMAX ?? item.message ?? "");
        const rawFileName = String(item.filename || item.FileUID || "").trim();
        const noteId = String(item.id ?? item.noteid ?? item._noteid ?? Date.now());

        if (onSelectNote) {
            onSelectNote(item);
        }

        if (!rawFileName) {
            setNoteDetails({
                maxAudioRecordingTime: 60000,
                maxVideoRecordingTime: 60000,
                noteId,
                noteTitle: "",
                notecontent: textContent,
                notefile: undefined,
                notefileName: undefined,
                noteaudio: undefined,
                notevideo: undefined,
                noteCreatedAt: new Date(),
            });
            setRefreshToken((v) => v + 1);
            return;
        }

        const cleanName = getCleanFileName(rawFileName);

        // Show note text immediately while file is being fetched
        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId,
            noteTitle: "",
            notecontent: textContent,
            notefile: undefined,
            notefileName: cleanName,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);

        const storagePath = buildStoragePathForTickets(rawFileName);

        statusBarContext.setIsLoading(true);
        try {
            const res = await downloadSingleFile(storagePath);
            const downloadUrl = res?.blobUrl;
            if (downloadUrl) {
                const response = await fetch(downloadUrl);
                const fileBlob = await response.blob();

                setNoteDetails({
                    maxAudioRecordingTime: 60000,
                    maxVideoRecordingTime: 60000,
                    noteId,
                    noteTitle: "",
                    notecontent: textContent,
                    notefile: fileBlob,
                    notefileName: cleanName,
                    noteaudio: undefined,
                    notevideo: undefined,
                    noteCreatedAt: new Date(),
                });
                setRefreshToken((v) => v + 1);
            }
        } catch (err) {
            console.error("ContactUsNotes: failed to fetch attached file for note editor", err);
        } finally {
            statusBarContext.setIsLoading(false);
        }
    }, [downloadSingleFile, onSelectNote, statusBarContext]);

    // ── LOAD: fetch from hook whenever selected node / bid changes ────────────
    useEffect(() => {
        if (!bid) return;
        getNotes()
            .then((fetched) => {
                const rows = Array.isArray(fetched) ? fetched : [];
                // Sort ascending by date so new messages appear at the end of the list
                const sortedRows = [...rows].sort((a, b) => parseNoteDate(a) - parseNoteDate(b));
                setNotesItems(sortedRows);
                setOriginalNotesItems(sortedRows);
                if (sortedRows.length > 0 && onSelectNote && !selectedNoteItem) {
                    onSelectNote(sortedRows[sortedRows.length - 1]);
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
        // Sort ascending by date so new messages appear at the end of the list
        const sortedRows = [...notes].sort((a, b) => parseNoteDate(a) - parseNoteDate(b));
        setNotesItems(sortedRows);
        setOriginalNotesItems(sortedRows);
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

        // ── Upload attached file if present ───────────────────────────────────
        let uploadedFileName = "";
        const attachedData = message.notefile || message.noteaudio || message.notevideo;

        if (attachedData) {
            const rawFileName = message.notefileName
                || (attachedData instanceof File ? attachedData.name : "")
                || (message.notevideo ? "video.mp4" : message.noteaudio ? "audio.webm" : "image.png");

            // If editing and user kept the original attachment without replacing it:
            const existingFileName = editingItem
                ? String(editingItem.filename || editingItem.FileUID || "").trim()
                : "";
            const isSameAsExisting = Boolean(
                existingFileName && getCleanFileName(existingFileName) === rawFileName
            );

            if (isSameAsExisting) {
                uploadedFileName = existingFileName;
            } else {
                const defaultExt = message.notevideo ? "mp4" : message.noteaudio ? "webm" : "png";
                uploadedFileName = generateUniqueFileName(bid, cid, rawFileName, defaultExt);

                const filepath = buildStoragePathForTickets(uploadedFileName);
                setFileUploading(true);
                try {
                    const uploadResult = await uploadSingleFile(attachedData, filepath);
                    if (!uploadResult?.success) {
                        console.error("ContactUsNotes: uploadSingleFile failed", uploadResult?.error, uploadResult?.message, uploadResult);
                    }
                } catch (err) {
                    console.error("ContactUsNotes: uploadSingleFile error", err);
                } finally {
                    setFileUploading(false);
                }
            }
        }

        // ── EDIT MODE: If user selected an existing note card, call updateNote ──
        if (editingItem) {
            const noteIdToUpdate = String(
                editingItem.id ?? editingItem.noteid ?? editingItem._noteid ?? ""
            );
            const finalFileName = uploadedFileName || "";

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
                            FileUID: finalFileName,
                            filename: finalFileName,
                        };
                    }
                    return item;
                });

            setNotesItems(applyUpdate);
            setOriginalNotesItems(applyUpdate);
            resetEditor();

            if (noteIdToUpdate) {
                const updatePayload: Record<string, unknown> = {
                    message: noteText,
                    monitorupdated: now,
                    filename: finalFileName,
                };
                const result = await updateNote(noteIdToUpdate, updatePayload);
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
        const finalFilename = uploadedFileName || (notesType !== "Message" ? `file-${Date.now()}` : "");

        const notePayload: INoteDoc = {
            bid,
            cid,
            noteid,
            noteby,
            message: noteText,
            filename: finalFilename,
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
            filename: finalFilename,
            ...(finalFilename ? { FileUID: finalFilename } : {}),
        };
        setNotesItems((prev) => [...prev, optimisticRow]);
        setOriginalNotesItems((prev) => [...prev, optimisticRow]);
        resetEditor();

        const result = await createNote(notePayload as unknown as Record<string, unknown>);
        if (!result?.success) {
            console.error("ContactUsNotes: createNote failed", result?.error);
        }
    }, [editingItem, resetEditor, updateNote, cid, bid, noteby, selectedNode, createNote, uploadSingleFile]);

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
        const itemToDelete = deleteItem;
        setDeleteItem(null);
        setDeleteOpen(false);

        if (itemToDelete) {
            const rawFileName = String(itemToDelete.filename || itemToDelete.FileUID || "").trim();
            const noteid = String(itemToDelete.id ?? itemToDelete.noteid ?? itemToDelete._noteid ?? "");

            if (editingItem === itemToDelete) {
                resetEditor();
            }
            setNotesItems((prev) => prev.filter((i) => i !== itemToDelete));
            setOriginalNotesItems((prev) => prev.filter((i) => i !== itemToDelete));

            statusBarContext.setIsLoading(true);
            try {
                // 1. If file exists, delete the file FIRST from Cloud Storage
                if (rawFileName) {
                    try {
                        const storagePath = buildStoragePathForTickets(rawFileName);
                        await deleteFiles([storagePath]);
                    } catch (storageErr) {
                        console.warn("ContactUsNotes: Cloud storage file deletion failed or file already removed", storageErr);
                    }
                }

                // 2. Then delete the note document from Firestore
                if (noteid) {
                    const result = await deleteNote(noteid);
                    if (!result?.success) {
                        console.error("ContactUsNotes: deleteNote failed", result?.error);
                    }
                }
            } catch (err) {
                console.error("ContactUsNotes: delete operation failed", err);
            } finally {
                statusBarContext.setIsLoading(false);
            }
        }
    };

    const handleDeleteAttachment = useCallback(
        (objectType: "file" | "audio" | "video", _objectData?: Blob | File) => {
            if (objectType === "file") {
                setNoteDetails((prev) =>
                    prev
                        ? {
                            ...prev,
                            notefile: undefined,
                            notefileName: undefined,
                        }
                        : undefined
                );
            }
        },
        []
    );

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
                    <div className="nz-notes-list-scroll" ref={scrollRef}>
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
                                        {Boolean((item.filename && String(item.filename).trim() !== "") || (item.FileUID && String(item.FileUID).trim() !== "")) ? (
                                            <div
                                                className="nz-info-image"
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDownloadFile(item, e);
                                                }}
                                            >
                                                <Image
                                                    uniqueName={`${uniqueName}-attach-${index}`}
                                                    source={
                                                        <Attach24x24
                                                            size={FnGetCssVariable("--image-size-1")}
                                                            fill="none"
                                                            strokeWidth={1}
                                                        />
                                                    }
                                                    w="var(--image-size-2)"
                                                    tooltip={`Click to download ${getCleanFileName(String(item.filename || item.FileUID || "")) || "file"}`}
                                                />
                                            </div>
                                        ) : (
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
                                        )}
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
