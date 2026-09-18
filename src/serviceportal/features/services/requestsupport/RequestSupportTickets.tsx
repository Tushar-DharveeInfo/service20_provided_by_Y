import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Attach24x24, Delete24x24, Info24x24 } from '@n20a/libicon';
import { useBusinessTickets, useFileDownload, useFileDelete } from '@n20a/libfsdb';
import type { ITicketDoc } from '@n20a/libfsdb';
import { Notes, type INote } from '@n20a/libavnotes';
import '@n20a/libavnotes/style.css';
import { Label } from '../../../shared/basic/label/Label';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { Image } from '../../../shared/basic/image/Image';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { FilterKeywordControl } from '../../../shared/searchfilter/filterkeywordcontrol/FilterKeywordControl';
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnGetCssVariable } from '../../../shared/allcommon/FnGetCssVariable';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import type { IImage } from '../../../shared/allinterface/basic/IImage';
import { useUploadRemoteFile } from '../../../shared/allcommon/UploadRemoteFileHooks';
import { FnGetCloudFilePublicUrl } from '../../allcommon/FnGetCloudFilePublicUrl';
import './RequestSupport.css';

export interface IRequestSupportTicketsProps {
    uniqueName: string;
    onSelectTicket?: (ticket: ITicketDoc | null) => void;
    selectedTicket?: ITicketDoc | null;
    deletedTicketId?: string | null;
}

/**
 * Resolves Firestore date values (timestamp object { seconds, nanoseconds }, Date, or string)
 * to an ISO date string.
 */
function resolveFirestoreDate(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object' && value !== null) {
        if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
            return (value as { toDate: () => Date }).toDate().toISOString();
        }
        const ts = value as Record<string, unknown>;
        const seconds = typeof ts.seconds === 'number' ? ts.seconds : Number(ts.seconds ?? 0);
        if (!isNaN(seconds) && seconds > 0) {
            return new Date(seconds * 1000).toISOString();
        }
    }
    return '';
}

/**
 * Converts a ticket document into a numeric timestamp for chronological sorting.
 */
function parseTicketDate(item: ITicketDoc): number {
    const rawDate = item.daterequested || item.lastupdated || item.monitorupdated || (item as Record<string, any>).datecreated;
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
            if (!isNaN(parsed)) return parsed;
        }
    }
    // Fallback: extract timestamp from ticketid if available (e.g. ticket_1788857795000)
    const ticketId = item.ticketid || '';
    const match = ticketId.match(/_(\d{10,14})$/);
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
 * Normalizes raw Firestore ticket document record into ITicketDoc format.
 */
function normalizeTicketDoc(raw: Record<string, unknown>): ITicketDoc {
    return {
        bid: String(raw.bid ?? ''),
        cid: String(raw.cid ?? ''),
        ticketid: String(raw.ticketid ?? raw.id ?? ''),
        tickettype: String(raw.tickettype ?? 'Support'),
        subscription: String(raw.subscription ?? ''),
        mfg: String(raw.mfg ?? ''),
        eqtype: String(raw.eqtype ?? ''),
        prodno: String(raw.prodno ?? raw.filename ?? ''),
        moreinfo: String(raw.moreinfo ?? raw.message ?? ''),
        status: String(raw.status ?? 'Pending'),
        daterequested: resolveFirestoreDate(raw.daterequested ?? raw.datecreated),
        datereleased: resolveFirestoreDate(raw.datereleased),
        lastupdated: resolveFirestoreDate(raw.lastupdated ?? raw.monitorupdated),
        monitorupdated: resolveFirestoreDate(raw.monitorupdated ?? raw.lastupdated),
        monitor: Boolean(raw.monitor ?? false),
    };
}

const RequestSupportTickets: React.FC<IRequestSupportTicketsProps> = ({
    uniqueName,
    onSelectTicket,
    selectedTicket,
    deletedTicketId,
}) => {
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? '').trim();
    const cid = String(authSession?.cid ?? '').trim();
    const bucketName = authSession?.bucketName ?? 'n20-bucket-01';
    const baseFolder = authSession?.baseFolder ?? 'sm';

    const getStoragePath = useCallback((filename: string): string => {
        if (!filename) return "";
        if (filename.includes("/")) return filename;
        return `${bucketName}/${baseFolder}/smfiles/tickets/${filename}`;
    }, [bucketName, baseFolder]);

    // SMDB ticket hook for businesses/{bid}/tickets/{ticketid}
    const {
        tickets,
        loading,
        error,
        getTickets,
        createTicket,
        updateTicket,
        deleteTicket,
    } = useBusinessTickets(bid);

    // Firebase storage hooks
    const { upload: uploadRemoteFile, uploading: remoteUploading, progress: uploadProgress, error: remoteUploadError } = useUploadRemoteFile();
    const { downloadSingleFile, getDownloadUrl, downloading } = useFileDownload();
    const { deleteFiles, deleting } = useFileDelete();
    const [fileUploading, setFileUploading] = useState(false);

    // Sync hook loading state with global status bar
    useEffect(() => {
        const isBusy = loading || remoteUploading || fileUploading || downloading || deleting;
        statusBarContext?.setIsLoading?.(isBusy);
        return () => {
            statusBarContext?.setIsLoading?.(false);
        };
    }, [loading, remoteUploading, fileUploading, downloading, deleting, statusBarContext]);

    // Keep callbacks in refs to avoid triggering re-fetch effects on prop updates
    const onSelectTicketRef = useRef(onSelectTicket);
    useEffect(() => {
        onSelectTicketRef.current = onSelectTicket;
    });

    const selectedTicketRef = useRef(selectedTicket);
    useEffect(() => {
        selectedTicketRef.current = selectedTicket;
    });

    const createActivityLogRef = useRef(mainAppContext.createActivityLog);
    useEffect(() => {
        createActivityLogRef.current = mainAppContext.createActivityLog;
    });

    // Guard ref to ensure getTickets() is called exactly once per bid
    const hasFetchedBidRef = useRef<string>('');

    // Local state
    const [ticketList, setTicketList] = useState<ITicketDoc[]>([]);
    const [originalTicketList, setOriginalTicketList] = useState<ITicketDoc[]>([]);
    const [editingTicket, setEditingTicket] = useState<ITicketDoc | null>(null);
    const [noteDetails, setNoteDetails] = useState<INote>();
    const [searchText, setSearchText] = useState('');
    const [lensDirty, setLensDirty] = useState(false);
    const [deleteItem, setDeleteItem] = useState<ITicketDoc | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [dialogTitle, setDialogTitle] = useState('Information');
    const [showOkButton, setShowOkButton] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const showFileNotFoundAlert = useCallback(() => {
        setDialogTitle('Information');
        setConfirmMessage('File not found.');
        setShowOkButton(true);
        setDeleteOpen(true);
    }, []);

    // Auto-scroll to bottom when tickets list changes so newly added ticket is visible
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [ticketList.length]);

    // Reset editor to blank create mode
    const resetEditor = useCallback(() => {
        setEditingTicket(null);
        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId: `${Date.now()}`,
            noteTitle: '',
            notecontent: '',
            notefile: undefined,
            notefileName: undefined,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
    }, []);

    // Download attached file from cloud storage
    const handleDownloadFile = useCallback(async (ticket: ITicketDoc, e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        const rawFileName = String(ticket.prodno || (ticket as Record<string, any>).filename || '').trim();
        if (!rawFileName) {
            showFileNotFoundAlert();
            return;
        }

        const cleanName = getCleanFileName(rawFileName) || 'attachment';
        const storagePath = getStoragePath(rawFileName);
        statusBarContext?.setIsLoading?.(true);
        statusBarContext?.setLoadingLabel?.('Downloading attachment...');

        try {
            let finalDownloadUrl: string | undefined;

            // Strategy 1: getDownloadUrl via Firebase Storage
            try {
                const urlRes = await getDownloadUrl(storagePath);
                if (urlRes?.success && urlRes.downloadUrl) {
                    finalDownloadUrl = urlRes.downloadUrl;
                }
            } catch (err) {
                console.warn('RequestSupportTickets: getDownloadUrl failed', err);
            }

            // Strategy 2: FnGetCloudFilePublicUrl via CloudRun API
            if (!finalDownloadUrl) {
                try {
                    finalDownloadUrl = await FnGetCloudFilePublicUrl(rawFileName, {
                        bucketName,
                        baseFolder,
                        folder: 'smfiles/tickets',
                    });
                } catch (err) {
                    console.warn('RequestSupportTickets: FnGetCloudFilePublicUrl failed', err);
                }
            }

            // Strategy 3: downloadSingleFile (Blob URL)
            if (!finalDownloadUrl) {
                try {
                    const res = await downloadSingleFile(storagePath);
                    if (res?.success && res.blobUrl) {
                        finalDownloadUrl = res.blobUrl;
                    }
                } catch (err) {
                    console.warn('RequestSupportTickets: downloadSingleFile failed', err);
                }
            }

            if (!finalDownloadUrl) {
                showFileNotFoundAlert();
                return;
            }

            let downloadSuccess = false;

            // If finalDownloadUrl is already a blob URL (e.g. from Strategy 3)
            if (finalDownloadUrl.startsWith('blob:')) {
                const link = document.createElement('a');
                link.href = finalDownloadUrl;
                link.download = cleanName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(finalDownloadUrl!), 1000);
                downloadSuccess = true;
            } else {
                try {
                    const resp = await fetch(finalDownloadUrl);
                    if (resp.ok) {
                        const contentType = resp.headers.get('content-type') || '';
                        const blob = await resp.blob();
                        // Check if returned XML error payload instead of real file
                        if (contentType.includes('xml') && blob.size < 1000) {
                            const text = await blob.text();
                            if (text.includes('<Error>') || text.includes('NoSuchKey') || text.includes('AccessDenied')) {
                                showFileNotFoundAlert();
                                return;
                            }
                        }
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = cleanName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                        downloadSuccess = true;
                    } else {
                        console.warn('RequestSupportTickets: fetch returned non-ok status', resp.status);
                    }
                } catch (fetchErr) {
                    console.warn('RequestSupportTickets: direct blob fetch failed', fetchErr);
                }

                // If fetch was not successful, try downloadSingleFile before giving up
                if (!downloadSuccess) {
                    try {
                        const res = await downloadSingleFile(storagePath);
                        if (res?.success && res.blobUrl) {
                            const link = document.createElement('a');
                            link.href = res.blobUrl;
                            link.download = cleanName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setTimeout(() => URL.revokeObjectURL(res.blobUrl!), 1000);
                            downloadSuccess = true;
                        }
                    } catch (singleErr) {
                        console.warn('RequestSupportTickets: fallback downloadSingleFile failed', singleErr);
                    }
                }
            }

            if (!downloadSuccess) {
                showFileNotFoundAlert();
            }
        } catch (err) {
            console.error('RequestSupportTickets: handleDownloadFile error', err);
            showFileNotFoundAlert();
        } finally {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.(undefined);
        }
    }, [downloadSingleFile, getDownloadUrl, getStoragePath, statusBarContext, bucketName, baseFolder, showFileNotFoundAlert]);

    // Select a ticket card to view & edit
    const handleSelectTicketToEdit = useCallback(async (ticket: ITicketDoc) => {
        setEditingTicket(ticket);
        const rawFileName = String(ticket.prodno || (ticket as Record<string, any>).filename || '').trim();
        const cleanName = getCleanFileName(rawFileName);

        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId: ticket.ticketid || `${Date.now()}`,
            noteTitle: ticket.tickettype || 'Support',
            notecontent: ticket.moreinfo || '',
            notefile: undefined,
            notefileName: cleanName || undefined,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
        if (onSelectTicketRef.current) {
            onSelectTicketRef.current(ticket);
        }

        if (rawFileName) {
            const storagePath = getStoragePath(rawFileName);
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Loading attachment...');
            let downloadUrl: string | undefined;
            try {
                // Strategy 1: getDownloadUrl
                try {
                    const urlRes = await getDownloadUrl(storagePath);
                    if (urlRes?.success && urlRes.downloadUrl) {
                        downloadUrl = urlRes.downloadUrl;
                    }
                } catch (e) {
                    console.warn('RequestSupportTickets: getDownloadUrl failed for editor', e);
                }

                // Strategy 2: FnGetCloudFilePublicUrl
                if (!downloadUrl) {
                    try {
                        downloadUrl = await FnGetCloudFilePublicUrl(rawFileName, {
                            bucketName,
                            baseFolder,
                            folder: 'smfiles/tickets',
                        });
                    } catch (e) {
                        console.warn('RequestSupportTickets: FnGetCloudFilePublicUrl failed for editor', e);
                    }
                }

                // Strategy 3: downloadSingleFile
                if (!downloadUrl) {
                    try {
                        const res = await downloadSingleFile(storagePath);
                        if (res?.success && res.blobUrl) {
                            downloadUrl = res.blobUrl;
                        }
                    } catch (e) {
                        console.warn('RequestSupportTickets: downloadSingleFile failed for editor', e);
                    }
                }

                let fileBlob: Blob | undefined;
                if (downloadUrl) {
                    try {
                        const response = await fetch(downloadUrl);
                        if (response.ok) {
                            fileBlob = await response.blob();
                        }
                    } catch (fetchErr) {
                        console.warn('RequestSupportTickets: failed to fetch blob from downloadUrl', fetchErr);
                    }
                }

                if (!fileBlob) {
                    fileBlob = new File([''], cleanName, { type: 'application/octet-stream' });
                }

                setNoteDetails({
                    maxAudioRecordingTime: 60000,
                    maxVideoRecordingTime: 60000,
                    noteId: ticket.ticketid || `${Date.now()}`,
                    noteTitle: ticket.tickettype || 'Support',
                    notecontent: ticket.moreinfo || '',
                    notefile: fileBlob,
                    notefileName: cleanName,
                    noteaudio: undefined,
                    notevideo: undefined,
                    noteCreatedAt: new Date(),
                });
                setRefreshToken((v) => v + 1);
            } catch (err) {
                console.error("RequestSupportTickets: failed to fetch attached file for note editor", err);
            } finally {
                statusBarContext?.setIsLoading?.(false);
            }
        }
    }, [downloadSingleFile, getDownloadUrl, getStoragePath, statusBarContext, bucketName, baseFolder]);

    // Initial fetch on mount or bid change
    useEffect(() => {
        if (!bid) return;
        if (hasFetchedBidRef.current === bid) return;
        hasFetchedBidRef.current = bid;

        let isCancelled = false;
        getTickets()
            .then((fetched) => {
                if (isCancelled) return;
                const rows = Array.isArray(fetched)
                    ? fetched.map((item) => normalizeTicketDoc(item))
                    : [];
                // Sort ascending by date so new cards appear at the end of the list
                const sortedRows = [...rows].sort((a, b) => parseTicketDate(a) - parseTicketDate(b));
                setTicketList(sortedRows);
                setOriginalTicketList(sortedRows);
                if (sortedRows.length > 0 && onSelectTicketRef.current && !selectedTicketRef.current) {
                    onSelectTicketRef.current(sortedRows[sortedRows.length - 1]);
                }
            })
            .catch((err) => console.error('RequestSupportTickets: getTickets failed', err));
        resetEditor();

        return () => {
            isCancelled = true;
        };
    }, [bid, getTickets, resetEditor]);

    // Keep ticket list in sync with hook re-fetches
    useEffect(() => {
        if (!Array.isArray(tickets)) return;
        const rows = tickets.map((item) => normalizeTicketDoc(item as Record<string, unknown>));
        // Sort ascending by date so new cards appear at the end of the list
        const sortedRows = [...rows].sort((a, b) => parseTicketDate(a) - parseTicketDate(b));
        setTicketList(sortedRows);
        setOriginalTicketList(sortedRows);
    }, [tickets]);

    // Keep ticket list in sync when a ticket is updated from the right pane form
    useEffect(() => {
        if (!selectedTicket?.ticketid) return;
        const applySelectedUpdate = (prev: ITicketDoc[]) =>
            prev.map((item) =>
                item.ticketid === selectedTicket.ticketid
                    ? { ...item, ...selectedTicket }
                    : item
            );
        setTicketList(applySelectedUpdate);
        setOriginalTicketList(applySelectedUpdate);

        setEditingTicket((curr) => {
            if (curr && curr.ticketid === selectedTicket.ticketid) {
                return { ...curr, ...selectedTicket };
            }
            return curr;
        });
    }, [selectedTicket]);

    // Remove ticket if deleted from external details form
    useEffect(() => {
        if (!deletedTicketId) return;
        setTicketList((prev) => prev.filter((item) => item.ticketid !== deletedTicketId));
        setOriginalTicketList((prev) => prev.filter((item) => item.ticketid !== deletedTicketId));
        setEditingTicket((curr) => {
            if (curr && curr.ticketid === deletedTicketId) {
                resetEditor();
                return null;
            }
            return curr;
        });
    }, [deletedTicketId, resetEditor]);

    // Delete attachment from editor
    const handleDeleteAttachment = useCallback(
        (objectType: 'file' | 'audio' | 'video', _objectData?: Blob | File) => {
            if (objectType === 'file') {
                setNoteDetails((prev) =>
                    prev
                        ? {
                            ...prev,
                            notefile: undefined,
                            notefileName: undefined,
                        }
                        : prev
                );
            } else if (objectType === 'audio') {
                setNoteDetails((prev) => (prev ? { ...prev, noteaudio: undefined } : prev));
            } else if (objectType === 'video') {
                setNoteDetails((prev) => (prev ? { ...prev, notevideo: undefined } : prev));
            }
        },
        []
    );

    // Create or Update ticket
    const handleSendTicketNote = useCallback(async (note: INote) => {
        const text = note.notecontent?.trim() ?? '';
        if (!text) {
            setNoteDetails(note);
            setDialogTitle('Information');
            setConfirmMessage('Please enter a description for the support request before saving.');
            setShowOkButton(true);
            setDeleteOpen(true);
            return;
        }

        const now = new Date().toISOString();

        // ── Upload attached file if present ──
        let uploadedFileName = '';
        const attachedData = note.notefile || note.noteaudio || note.notevideo;

        if (attachedData) {
            const rawFileName = note.notefileName
                || (attachedData instanceof File ? attachedData.name : '')
                || (note.notevideo ? 'video.mp4' : note.noteaudio ? 'audio.webm' : 'image.png');

            const existingFileName = editingTicket
                ? String(editingTicket.prodno || (editingTicket as Record<string, any>).filename || '').trim()
                : '';
            const isSameAsExisting = Boolean(
                existingFileName && getCleanFileName(existingFileName) === rawFileName
            );

            if (isSameAsExisting) {
                uploadedFileName = existingFileName;
            } else {
                const defaultExt = note.notevideo ? 'mp4' : note.noteaudio ? 'webm' : 'png';
                uploadedFileName = generateUniqueFileName(bid, cid, rawFileName, defaultExt);

                setFileUploading(true);
                statusBarContext?.setIsLoading?.(true);
                statusBarContext?.setLoadingLabel?.('Uploading attachment...');
                try {
                    const uploadResult = await uploadRemoteFile({
                        source: attachedData,
                        bucket: bucketName,
                        baseFolder: baseFolder,
                        fileName: `smfiles/tickets/${uploadedFileName}`,
                    });
                    if (!uploadResult?.success) {
                        console.error('RequestSupportTickets: uploadRemoteFile failed', uploadResult?.error, uploadResult?.message);
                    }
                } catch (err) {
                    console.error('RequestSupportTickets: uploadRemoteFile error', err);
                } finally {
                    setFileUploading(false);
                    statusBarContext?.setIsLoading?.(false);
                }
            }
        }

        // ── EDIT MODE: update existing ticket ──
        if (editingTicket) {
            const ticketIdToUpdate = editingTicket.ticketid;
            const finalFileName = uploadedFileName || '';
            const previousFileName = String(editingTicket.prodno || (editingTicket as Record<string, any>).filename || '').trim();

            // If previous file attachment was replaced or removed, delete it from Cloud Storage
            if (previousFileName && previousFileName !== finalFileName && !previousFileName.startsWith('sample-file-')) {
                try {
                    statusBarContext?.setIsLoading?.(true);
                    statusBarContext?.setLoadingLabel?.('Deleting previous attachment...');
                    const oldStoragePath = getStoragePath(previousFileName);
                    await deleteFiles([oldStoragePath]);
                } catch (err) {
                    console.warn('RequestSupportTickets: error deleting previous attachment', err);
                } finally {
                    statusBarContext?.setIsLoading?.(false);
                }
            }

            const updatedTicket: ITicketDoc = {
                ...editingTicket,
                moreinfo: text,
                prodno: finalFileName || editingTicket.prodno,
                lastupdated: now,
                monitorupdated: now,
            };

            const applyUpdate = (prev: ITicketDoc[]) =>
                prev.map((item) => (item.ticketid === ticketIdToUpdate ? updatedTicket : item));

            setTicketList(applyUpdate);
            setOriginalTicketList(applyUpdate);
            if (onSelectTicketRef.current) {
                onSelectTicketRef.current(updatedTicket);
            }
            resetEditor();

            if (ticketIdToUpdate) {
                const updatePayload: Record<string, unknown> = {
                    moreinfo: text,
                    lastupdated: now,
                    monitorupdated: now,
                };
                if (finalFileName) {
                    updatePayload.prodno = finalFileName;
                }
                const result = await updateTicket(ticketIdToUpdate, updatePayload);
                if (result && result.success !== false) {
                    try {
                        await createActivityLogRef.current?.(`${cid} of ${bid} updated ticket ${ticketIdToUpdate} successfully.`);
                    } catch (logErr) {
                        console.error('RequestSupportTickets: createActivityLog failed on update', logErr);
                    }
                } else {
                    console.error('RequestSupportTickets: updateTicket failed', result?.error);
                }
            }
            return;
        }

        // ── CREATE MODE: create a new ticket ──
        const ticketid = `ticket_${Date.now()}`;
        const finalFileName = uploadedFileName || '';
        const newTicket: ITicketDoc = {
            bid,
            cid,
            ticketid,
            tickettype: 'Support Request',
            subscription: '',
            mfg: '',
            eqtype: '',
            prodno: finalFileName,
            moreinfo: text,
            status: 'Pending',
            daterequested: now,
            datereleased: '',
            lastupdated: now,
            monitorupdated: now,
            monitor: false,
        };

        setTicketList((prev) => [...prev, newTicket]);
        setOriginalTicketList((prev) => [...prev, newTicket]);
        if (onSelectTicketRef.current) {
            onSelectTicketRef.current(newTicket);
        }
        resetEditor();

        const result = await createTicket(newTicket as unknown as Record<string, unknown>);
        if (result && result.success !== false) {
            try {
                await createActivityLogRef.current?.(`${cid} of ${bid} created ticket ${ticketid} successfully.`);
            } catch (logErr) {
                console.error('RequestSupportTickets: createActivityLog failed on create', logErr);
            }
        } else {
            console.error('RequestSupportTickets: createTicket failed', result?.error);
        }
    }, [editingTicket, resetEditor, updateTicket, bid, cid, createTicket, uploadRemoteFile, bucketName, baseFolder, getStoragePath, deleteFiles, statusBarContext]);

    // Search filter
    const searchValueChange = (value: string) => {
        setSearchText(value);
        setLensDirty(Boolean(value.length));
        if (!value.length) setTicketList(originalTicketList);
    };

    const handleKeywordSearchResult = () => {
        const q = searchText.toLowerCase();
        setTicketList(
            originalTicketList.filter((ticket) =>
                (ticket.moreinfo ?? '').toLowerCase().includes(q) ||
                (ticket.ticketid ?? '').toLowerCase().includes(q) ||
                (ticket.tickettype ?? '').toLowerCase().includes(q) ||
                (ticket.status ?? '').toLowerCase().includes(q)
            )
        );
    };

    // Delete ticket
    const handleDeleteClick = (ticket: ITicketDoc) => {
        setDeleteItem(ticket);
        setDialogTitle('Information');
        setConfirmMessage(`Are you sure you want to delete ticket ${ticket.ticketid || ''}?`);
        setShowOkButton(false);
        setDeleteOpen(true);
    };

    const handleConfirmDeleteYes = async () => {
        const itemToDelete = deleteItem;
        setDeleteItem(null);
        setDeleteOpen(false);

        if (itemToDelete) {
            const ticketIdToDelete = itemToDelete.ticketid;
            const rawFileName = String(itemToDelete.prodno || (itemToDelete as Record<string, any>).filename || '').trim();

            setTicketList((prev) => prev.filter((item) => item.ticketid !== ticketIdToDelete && item !== itemToDelete));
            setOriginalTicketList((prev) => prev.filter((item) => item.ticketid !== ticketIdToDelete && item !== itemToDelete));
            if (editingTicket?.ticketid === ticketIdToDelete || editingTicket === itemToDelete) {
                resetEditor();
            }
            if ((selectedTicketRef.current?.ticketid === ticketIdToDelete || selectedTicketRef.current === itemToDelete) && onSelectTicketRef.current) {
                onSelectTicketRef.current(null);
            }

            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Deleting ticket...');
            try {
                // 1. Delete ticket document from Firestore
                let ticketDeleted = false;
                if (ticketIdToDelete) {
                    statusBarContext?.setLoadingLabel?.('Deleting ticket...');
                    const result = await deleteTicket(ticketIdToDelete);
                    if (result && result.success !== false) {
                        ticketDeleted = true;
                    } else {
                        console.error('RequestSupportTickets: deleteTicket failed', result?.error);
                    }
                }

                // 2. Delete attached file from cloud storage if present
                if (rawFileName && !rawFileName.startsWith('sample-file-')) {
                    try {
                        statusBarContext?.setLoadingLabel?.('Deleting attachment...');
                        const storagePath = getStoragePath(rawFileName);
                        await deleteFiles([storagePath]);
                    } catch (storageErr) {
                        console.warn('RequestSupportTickets: Cloud storage file deletion failed', storageErr);
                    }
                }

                // 3. Create activity log for deleting ticket
                if (ticketDeleted && ticketIdToDelete) {
                    try {
                        await createActivityLogRef.current?.(`${cid} of ${bid} deleted ticket ${ticketIdToDelete} successfully.`);
                    } catch (logErr) {
                        console.error('RequestSupportTickets: createActivityLog failed on delete', logErr);
                    }
                }
            } catch (err) {
                console.error('RequestSupportTickets: delete operation failed', err);
            } finally {
                statusBarContext?.setIsLoading?.(false);
            }
        }
    };

    const deleteIcon: IImage = {
        uniqueName: `${uniqueName}-delete-icon`,
        source: (
            <Delete24x24
                size={FnGetCssVariable('--image-size-2')}
                fill="none"
                strokeWidth={1}
            />
        ),
        w: 'var(--image-size-2)',
        type: 'svg',
        tooltip: 'Delete Ticket',
    };

    if (!bid) {
        return (
            <div className="nz-node-list-Container" key={uniqueName}>
                <Label uniqueName={`${uniqueName}-no-session`} label="Session not available." />
            </div>
        );
    }

    return (
        <div className="nz-node-list-Container" key={uniqueName}>
            {!loading && error && (
                <Label uniqueName={`${uniqueName}-error`} label={`Error: ${error}`} />
            )}

            <div className="nz-notes-list-main-div">
                <div className="nz-notes-list-with-msg-box">

                    {/* Search Bar */}
                    <div className="nz-notes-search">
                        <FilterKeywordControl
                            uniqueName={`${uniqueName}-filter`}
                            filterDirty={lensDirty}
                            searchInputValue={searchText}
                            handleFilterMouse={handleKeywordSearchResult}
                            searchValueChange={searchValueChange}
                            filterIconTooltip="Filter Tickets"
                        />
                    </div>

                    {/* Ticket Cards List */}
                    <div className="nz-notes-list-scroll" ref={scrollRef}>
                        {ticketList.map((item, index) => {
                            const isSelected = editingTicket
                                ? editingTicket.ticketid === item.ticketid
                                : selectedTicket
                                    ? selectedTicket.ticketid === item.ticketid
                                    : index === ticketList.length - 1;

                            const displayDate = item.lastupdated || item.daterequested;
                            const formattedDate = displayDate
                                ? FnConvertDateToUtcOrUtcToDate(displayDate, false, true)
                                : '';

                            const hasAttachment = Boolean(
                                (item.prodno && String(item.prodno).trim() !== '') ||
                                ((item as Record<string, any>).filename && String((item as Record<string, any>).filename).trim() !== '')
                            );

                            return (
                                <div
                                    className={`nz-node-list-box ${isSelected ? 'nz-node-list-box-selected' : ''}`}
                                    key={item.ticketid || index}
                                    onClick={() => handleSelectTicketToEdit(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="nz-node-list-delete">
                                        <ActionImage
                                            image={deleteIcon}
                                            w="var(--node_height)"
                                            h="var(--node_height)"
                                            uniqueName={`${uniqueName}-delete-${index}`}
                                            actionCode="delete"
                                            disabled={false}
                                            handleMouse={(e) => {
                                                e?.stopPropagation?.();
                                                handleDeleteClick(item);
                                            }}
                                        />
                                        <div className="nz-note-date">
                                            <Label
                                                uniqueName={`${uniqueName}-date-${index}`}
                                                label={formattedDate}
                                            />
                                        </div>
                                        <div className="nz-note-user">
                                            <Label
                                                uniqueName={`${uniqueName}-status-${index}`}
                                                label={`[${item.status || 'Pending'}]`}
                                            />
                                        </div>
                                    </div>
                                    <div className="nz-info-div">
                                        {hasAttachment ? (
                                            <div
                                                className="nz-info-image"
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDownloadFile(item, e);
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Image
                                                    uniqueName={`${uniqueName}-attach-${index}`}
                                                    source={
                                                        <Attach24x24
                                                            size={FnGetCssVariable('--image-size-1')}
                                                            fill="none"
                                                            strokeWidth={1}
                                                        />
                                                    }
                                                    w="var(--image-size-2)"
                                                    tooltip={`Click to download ${getCleanFileName(String(item.prodno || (item as Record<string, any>).filename || '')) || 'file'}`}
                                                />
                                            </div>
                                        ) : (
                                            <div className="nz-info-image">
                                                <Image
                                                    uniqueName={`${uniqueName}-info-${index}`}
                                                    source={
                                                        <Info24x24
                                                            size={FnGetCssVariable('--image-size-1')}
                                                            fill="none"
                                                            strokeWidth={1}
                                                        />
                                                    }
                                                    w="var(--image-size-2)"
                                                    tooltip={item.tickettype || 'Support'}
                                                />
                                            </div>
                                        )}
                                        <div className="nz-nodes-text">
                                            <Label
                                                uniqueName={`${uniqueName}-note-${index}`}
                                                label={item.moreinfo || item.ticketid || 'No details'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ticket Note / Message Editor */}
                    <div className="nz-notes-container" style={{ position: 'relative' }}>
                        {editingTicket && (
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
                                sendNote={handleSendTicketNote}
                                sendTooltip={editingTicket ? 'Update Ticket' : 'Create Ticket'}
                                handleDelete={handleDeleteAttachment}
                            />
                        )}
                    </div>
                </div>
            </div>

            <YesNoFormContainer
                isOpen={deleteOpen}
                uniqueName={`${uniqueName}-confirm`}
                dialogTitle={dialogTitle}
                message={confirmMessage}
                showOkButton={showOkButton}
                handleYesButtonClick={handleConfirmDeleteYes}
                handleNoButtonClick={() => setDeleteOpen(false)}
                handleOkButtonClick={() => setDeleteOpen(false)}
            />
        </div>
    );
};

export { RequestSupportTickets };
export default RequestSupportTickets;