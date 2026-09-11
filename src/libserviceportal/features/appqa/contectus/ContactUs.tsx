
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
import { useBusinessTickets, useFileDownload, useFileDelete } from "@n20a/libfsdb"
import type { ITicketDoc } from "@n20a/libfsdb"
import { useUploadRemoteFile } from "../../../shared/allcommon/UploadRemoteFileHooks.ts"
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
 * Converts a ticket document / row into a numeric timestamp for chronological sorting.
 */
function parseTicketDate(item: Record<string, any>): number {
    const rawDate = item.lastupdated ?? item.daterequested ?? item.datecreated ?? item.monitorupdated;
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
    // Fallback: extract timestamp from ticketid if available
    const id = String(item.ticketid ?? item.id ?? "");
    const match = id.match(/_(\d{10,13})$/);
    if (match) {
        const ts = Number(match[1]);
        if (!isNaN(ts)) return ts;
    }
    return 0;
}

/**
 * Normalizes a ticket document into a uniform shape supporting ITicketDoc.
 */
function normalizeTicketRow(raw: Record<string, any>): ITicketDoc {
    const text = String(raw.moreinfo ?? raw.NotesMAX ?? raw.message ?? '');
    const filename = String(raw.prodno ?? raw.filename ?? raw.FileUID ?? '');
    const ticketid = String(raw.ticketid ?? raw.id ?? raw.noteid ?? raw._noteid ?? '');
    const date = resolveFirestoreDate(raw.lastupdated ?? raw.daterequested ?? raw.datecreated ?? raw.monitorupdated);
    return {
        bid: String(raw.bid ?? ''),
        cid: String(raw.cid ?? raw.UserName ?? raw.noteby ?? 'User'),
        ticketid,
        tickettype: String(raw.tickettype ?? raw.NotesType ?? 'Contact Us'),
        subscription: String(raw.subscription ?? ''),
        mfg: String(raw.mfg ?? ''),
        eqtype: String(raw.eqtype ?? raw.NodeType ?? 'ContactUs'),
        prodno: filename,
        moreinfo: text,
        status: String(raw.status ?? raw.Status ?? 'Pending'),
        daterequested: resolveFirestoreDate(raw.daterequested) || date,
        datereleased: resolveFirestoreDate(raw.datereleased) || '',
        lastupdated: date,
        monitorupdated: resolveFirestoreDate(raw.monitorupdated) || date,
        monitor: Boolean(raw.monitor ?? false),
    };
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
 * Uses useBusinessTickets hook for live load / create / edit / delete.
 */
const ContactUsNotes = ({ uniqueName, selectedNode, onSelectNote, selectedNoteItem, isAppQa }: IContactUsNotes) => {
    // ── identity from context ────────────────────────────────────────────────
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? "").trim();
    const cid = String(authSession?.cid ?? "").trim();
    const noteby = authSession?.displayName ?? authSession?.username ?? "unknown";
    const bucketName = authSession?.bucketName ?? 'n20-bucket-01';
    const baseFolder = authSession?.baseFolder ?? 'sm';

    const getStoragePath = useCallback((filename: string): string => {
        if (!filename) return "";
        if (filename.includes("/")) return filename;
        return `${bucketName}/${baseFolder}/smfiles/tickets/${filename}`;
    }, [bucketName, baseFolder]);

    // ── firebase storage hooks ───────────────────────────────────────────────
    const { upload: uploadRemoteFile, uploading: remoteUploading, progress: uploadProgress, error: remoteUploadError } = useUploadRemoteFile();
    const { downloadSingleFile, downloading } = useFileDownload();
    const { deleteFiles, deleting } = useFileDelete();
    const [fileUploading, setFileUploading] = useState(false);

    // ── tickets hook ─────────────────────────────────────────────────────────
    const {
        tickets,
        loading,
        error,
        getTickets,
        createTicket,
        updateTicket,
        deleteTicket,
    } = useBusinessTickets(bid);

    const createActivityLogRef = useRef(mainAppContext.createActivityLog);
    useEffect(() => {
        createActivityLogRef.current = mainAppContext.createActivityLog;
    });

    // ── sync loader with status bar ───────────────────────────────────────────
    useEffect(() => {
        const isBusy = Boolean(loading || remoteUploading || fileUploading || downloading || deleting);
        statusBarContext?.setIsLoading?.(isBusy);
    }, [loading, remoteUploading, fileUploading, downloading, deleting, statusBarContext]);

    useEffect(() => {
        if (error) {
            statusBarContext?.setFetchError?.([error]);
        }
    }, [error, statusBarContext]);

    // ── local UI state ───────────────────────────────────────────────────────
    const [notesItems, setNotesItems] = useState<ITicketDoc[]>([]);
    const [originalNotesItems, setOriginalNotesItems] = useState<ITicketDoc[]>([]);
    const [noteDetails, setNoteDetails] = useState<INote>();
    const [searchText, setSearchText] = useState("");
    const [lensDirty, setLensDirty] = useState(false);
    const [deleteItem, setDeleteItem] = useState<ITicketDoc | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [showOkButton, setShowOkButton] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    /** The ticket card currently loaded into the editor for editing. null = create-new mode. */
    const [editingItem, setEditingItem] = useState<ITicketDoc | null>(null);
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
    const handleDownloadFile = useCallback(async (item: ITicketDoc, e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        const rawFileName = String(item.prodno || "").trim();
        if (!rawFileName) return;

        const storagePath = getStoragePath(rawFileName);
        statusBarContext?.setIsLoading?.(true);
        statusBarContext?.setLoadingLabel?.('Downloading file...');
        try {
            const res = await downloadSingleFile(storagePath);
            if (!res?.success) {
                console.error("ContactUsNotes: downloadSingleFile failed", res?.error, res?.message);
                return;
            }

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
                console.error("ContactUsNotes: downloadSingleFile returned no blobUrl", res?.error);
            }
        } catch (err) {
            console.error("ContactUsNotes: handleDownloadFile error", err);
        } finally {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    }, [downloadSingleFile, getStoragePath, statusBarContext]);

    // ── select a card to edit in the below notes control ──────────────────────
    const handleSelectCardToEdit = useCallback(async (item: ITicketDoc) => {
        setEditingItem(item);
        const textContent = String(item.moreinfo ?? "");
        const rawFileName = String(item.prodno ?? "").trim();
        const ticketId = String(item.ticketid ?? Date.now());

        if (onSelectNote) {
            onSelectNote(item);
        }

        if (!rawFileName) {
            setNoteDetails({
                maxAudioRecordingTime: 60000,
                maxVideoRecordingTime: 60000,
                noteId: ticketId,
                noteTitle: item.tickettype || "Contact Us",
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
            noteId: ticketId,
            noteTitle: item.tickettype || "Contact Us",
            notecontent: textContent,
            notefile: undefined,
            notefileName: cleanName,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);

        const storagePath = getStoragePath(rawFileName);

        statusBarContext?.setIsLoading?.(true);
        statusBarContext?.setLoadingLabel?.('Loading attachment...');
        try {
            const res = await downloadSingleFile(storagePath);
            if (!res?.success) {
                console.error("ContactUsNotes: downloadSingleFile failed", res?.error, res?.message);
                return;
            }

            const downloadUrl = res?.blobUrl;
            if (downloadUrl) {
                const response = await fetch(downloadUrl);
                const fileBlob = await response.blob();

                setNoteDetails({
                    maxAudioRecordingTime: 60000,
                    maxVideoRecordingTime: 60000,
                    noteId: ticketId,
                    noteTitle: item.tickettype || "Contact Us",
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
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    }, [downloadSingleFile, getStoragePath, onSelectNote, statusBarContext]);

    // ── LOAD: fetch from hook whenever selected node / bid changes ────────────
    useEffect(() => {
        if (!bid) return;
        getTickets()
            .then((fetched) => {
                const rows = Array.isArray(fetched) ? fetched : [];
                // Sort ascending by date so new messages appear at the end of the list
                const sortedRows = [...rows]
                    .map((r) => normalizeTicketRow(r as Record<string, unknown>))
                    .sort((a, b) => parseTicketDate(a) - parseTicketDate(b));
                setNotesItems(sortedRows);
                setOriginalNotesItems(sortedRows);
                if (sortedRows.length > 0 && onSelectNote && !selectedNoteItem) {
                    onSelectNote(sortedRows[sortedRows.length - 1]);
                }
            })
            .catch((err) => console.error("ContactUsNotes: getTickets failed", err));
        resetEditor();
    }, [selectedNode, bid, resetEditor, onSelectNote, getTickets]);

    // ── keep local list in sync when hook re-fetches ──────────────────────────
    useEffect(() => {
        if (!Array.isArray(tickets)) return;
        // Sort ascending by date so new messages appear at the end of the list
        const sortedRows = [...tickets]
            .map((item) => normalizeTicketRow(item as Record<string, unknown>))
            .sort((a, b) => parseTicketDate(a) - parseTicketDate(b));
        setNotesItems(sortedRows);
        setOriginalNotesItems(sortedRows);
    }, [tickets]);

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
            const existingFileName = editingItem ? String(editingItem.prodno || "").trim() : "";
            const isSameAsExisting = Boolean(
                existingFileName && getCleanFileName(existingFileName) === rawFileName
            );

            if (isSameAsExisting) {
                uploadedFileName = existingFileName;
            } else {
                const defaultExt = message.notevideo ? "mp4" : message.noteaudio ? "webm" : "png";
                uploadedFileName = generateUniqueFileName(bid, cid, rawFileName, defaultExt);

                setFileUploading(true);
                statusBarContext?.setIsLoading?.(true);
                statusBarContext?.setLoadingLabel?.('Uploading file...');
                try {
                    const uploadResult = await uploadRemoteFile({
                        source: attachedData,
                        bucket: bucketName,
                        baseFolder: baseFolder,
                        fileName: `smfiles/tickets/${uploadedFileName}`,
                    });
                    if (!uploadResult?.success) {
                        console.error("ContactUsNotes: uploadRemoteFile failed", uploadResult?.error, uploadResult?.message, uploadResult);
                    }
                } catch (err) {
                    console.error("ContactUsNotes: uploadRemoteFile error", err);
                } finally {
                    setFileUploading(false);
                    statusBarContext?.setIsLoading?.(false);
                    statusBarContext?.setLoadingLabel?.('');
                }
            }
        }

        // ── EDIT MODE: If user selected an existing note card, call updateTicket ──
        if (editingItem) {
            const ticketIdToUpdate = String(editingItem.ticketid || "");
            const finalFileName = uploadedFileName || "";
            const previousFileName = String(editingItem.prodno || '').trim();

            // If previous file attachment was replaced or removed, delete it from Cloud Storage
            if (previousFileName && previousFileName !== finalFileName && !previousFileName.startsWith('sample-file-')) {
                try {
                    statusBarContext?.setIsLoading?.(true);
                    statusBarContext?.setLoadingLabel?.('Deleting previous file...');
                    const oldStoragePath = getStoragePath(previousFileName);
                    await deleteFiles([oldStoragePath]);
                } catch (err) {
                    console.warn('ContactUsNotes: error deleting previous attachment', err);
                } finally {
                    statusBarContext?.setIsLoading?.(false);
                    statusBarContext?.setLoadingLabel?.('');
                }
            }

            // Optimistic update in local list
            const applyUpdate = (prev: ITicketDoc[]) =>
                prev.map((item) => {
                    if (item === editingItem || (ticketIdToUpdate && item.ticketid === ticketIdToUpdate)) {
                        return {
                            ...item,
                            moreinfo: noteText,
                            lastupdated: now,
                            monitorupdated: now,
                            prodno: finalFileName,
                        };
                    }
                    return item;
                });

            setNotesItems(applyUpdate);
            setOriginalNotesItems(applyUpdate);
            resetEditor();

            if (ticketIdToUpdate) {
                // Strictly ITicketDoc fields only - no notes-control keys!
                const updatePayload: Record<string, unknown> = {
                    moreinfo: noteText,
                    lastupdated: now,
                    monitorupdated: now,
                };
                if (finalFileName) {
                    updatePayload.prodno = finalFileName;
                }
                const result = await updateTicket(ticketIdToUpdate, updatePayload);
                if (result && result.success !== false) {
                    await createActivityLogRef.current?.(`${cid || noteby} of ${bid} updated ticket ${ticketIdToUpdate} successfully.`);
                } else {
                    console.error("ContactUsNotes: updateTicket failed", result?.error);
                }
            }
            return;
        }

        // ── CREATE MODE: Add a new ticket ────────────────────────────────────
        const ticketid = `ticket_${Date.now()}`;
        const finalFilename = uploadedFileName || "";

        // Strictly conform to ITicketDoc - do not include EntityName, NodeType, NotesMAX, NotesType, UserName, Status, message, filename
        const newTicket: ITicketDoc = {
            bid,
            cid: cid || noteby,
            ticketid,
            tickettype: 'Contact Us',
            subscription: '',
            mfg: '',
            eqtype: selectedNode?.NodeType ?? 'ContactUs',
            prodno: finalFilename,
            moreinfo: noteText,
            status: 'Pending',
            daterequested: now,
            datereleased: '',
            lastupdated: now,
            monitorupdated: now,
            monitor: false,
        };

        setNotesItems((prev) => [...prev, newTicket]);
        setOriginalNotesItems((prev) => [...prev, newTicket]);
        resetEditor();

        const result = await createTicket(newTicket as unknown as Record<string, unknown>);
        if (result && result.success !== false) {
            await createActivityLogRef.current?.(`${cid || noteby} of ${bid} created ticket ${ticketid} successfully.`);
        } else {
            console.error("ContactUsNotes: createTicket failed", result?.error);
        }
    }, [editingItem, resetEditor, updateTicket, cid, bid, noteby, selectedNode, createTicket, uploadRemoteFile, bucketName, baseFolder, getStoragePath, deleteFiles, statusBarContext]);

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
                (item.moreinfo ?? "").toLowerCase().includes(q) ||
                (item.ticketid ?? "").toLowerCase().includes(q)
            )
        );
    };

    // ── DELETE ────────────────────────────────────────────────────────────────
    const handleDelete = (item: ITicketDoc) => {
        setDeleteItem(item);
        setConfirmMessage("Are you sure you want to delete this ticket?");
        setShowOkButton(false);
        setDeleteOpen(true);
    };

    const handleConfirmYesClick = async () => {
        const itemToDelete = deleteItem;
        setDeleteItem(null);
        setDeleteOpen(false);

        if (itemToDelete) {
            const rawFileName = String(itemToDelete.prodno || "").trim();
            const ticketIdToDelete = String(itemToDelete.ticketid || "");

            if (editingItem === itemToDelete) {
                resetEditor();
            }
            setNotesItems((prev) => prev.filter((i) => i !== itemToDelete));
            setOriginalNotesItems((prev) => prev.filter((i) => i !== itemToDelete));

            statusBarContext.setIsLoading(true);
            statusBarContext.setLoadingLabel?.('Deleting ticket...');
            try {
                // 1. If file exists, delete the file FIRST from Cloud Storage
                if (rawFileName) {
                    try {
                        statusBarContext.setLoadingLabel?.('Deleting file...');
                        const storagePath = getStoragePath(rawFileName);
                        await deleteFiles([storagePath]);
                    } catch (storageErr) {
                        console.warn("ContactUsNotes: Cloud storage file deletion failed or file already removed", storageErr);
                    }
                }

                // 2. Then delete the ticket document from Firestore
                if (ticketIdToDelete) {
                    statusBarContext.setLoadingLabel?.('Deleting ticket...');
                    const result = await deleteTicket(ticketIdToDelete);
                    if (result && result.success !== false) {
                        await createActivityLogRef.current?.(`${cid || noteby} of ${bid} deleted ticket ${ticketIdToDelete} successfully.`);
                    } else {
                        console.error("ContactUsNotes: deleteTicket failed", result?.error);
                    }
                }
            } catch (err) {
                console.error("ContactUsNotes: delete operation failed", err);
            } finally {
                statusBarContext.setIsLoading(false);
                statusBarContext.setLoadingLabel?.('');
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
                                ? editingItem === item ||
                                  (Boolean(editingItem.ticketid) && item.ticketid === editingItem.ticketid)
                                : isAppQa
                                    ? false
                                    : selectedNoteItem
                                        ? Boolean(selectedNoteItem.ticketid && selectedNoteItem.ticketid === item.ticketid)
                                        : index === 0;
                            return (
                                <div
                                    className={`nz-node-list-box ${isSelected ? "nz-node-list-box-selected" : ""}`}
                                    key={`${resolveFirestoreDate(item.lastupdated || item.daterequested) || index}-${index}`}
                                    onClick={() => handleSelectCardToEdit(item)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="nz-node-list-delete">
                                        {/* <ActionImage
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
                                        /> */}
                                        <div className="nz-note-date">
                                            <Label
                                                uniqueName={`${uniqueName}-date-${index}`}
                                                label={FnConvertDateToUtcOrUtcToDate(
                                                    resolveFirestoreDate(item.lastupdated || item.daterequested),
                                                    false,
                                                    true
                                                )}
                                            />
                                        </div>
                                        <div className="nz-note-user">
                                            <Label
                                                uniqueName={`${uniqueName}-user-${index}`}
                                                label={`${item.cid || "User"}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="nz-info-div">
                                        {Boolean(item.prodno && String(item.prodno).trim() !== "") ? (
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
                                                    tooltip={`Click to download ${getCleanFileName(String(item.prodno || "")) || "file"}`}
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
                                                    tooltip={item.tickettype || "Contact Us"}
                                                />
                                            </div>
                                        )}
                                        <div className="nz-nodes-text">
                                            <Label
                                                uniqueName={`${uniqueName}-note-${index}`}
                                                label={item.moreinfo || ""}
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
