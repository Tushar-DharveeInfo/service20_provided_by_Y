import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete24x24, Info24x24 } from '@n20a/libicon';
import { useBusinessTickets } from '@n20a/libfsdb';
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
import './RequestSupport.css';

export interface IRequestSupportTicketsProps {
    uniqueName: string;
    onSelectTicket?: (ticket: ITicketDoc | null) => void;
    selectedTicket?: ITicketDoc | null;
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
        prodno: String(raw.prodno ?? ''),
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
}) => {
    const mainAppContext = useMainAppContext();
    const { setIsLoading } = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? '').trim();
    const cid = String(authSession?.cid ?? '').trim();

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

    // Sync hook loading state with global status bar
    useEffect(() => {
        setIsLoading(loading);
        return () => {
            setIsLoading(false);
        };
    }, [loading, setIsLoading]);

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
    const [showOkButton, setShowOkButton] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);

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
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
    }, []);

    // Select a ticket card to view & edit
    const handleSelectTicketToEdit = useCallback((ticket: ITicketDoc) => {
        setEditingTicket(ticket);
        setNoteDetails({
            maxAudioRecordingTime: 60000,
            maxVideoRecordingTime: 60000,
            noteId: ticket.ticketid || `${Date.now()}`,
            noteTitle: ticket.tickettype || 'Support',
            notecontent: ticket.moreinfo || '',
            notefile: undefined,
            noteaudio: undefined,
            notevideo: undefined,
            noteCreatedAt: new Date(),
        });
        setRefreshToken((v) => v + 1);
        if (onSelectTicketRef.current) {
            onSelectTicketRef.current(ticket);
        }
    }, []);

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
                setTicketList(rows);
                setOriginalTicketList(rows);
                if (rows.length > 0 && onSelectTicketRef.current && !selectedTicketRef.current) {
                    onSelectTicketRef.current(rows[0]);
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
        setTicketList(rows);
        setOriginalTicketList(rows);
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

    // Create or Update ticket
    const handleSendTicketNote = useCallback(async (note: INote) => {
        const text = note.notecontent?.trim() ?? '';
        if (!text) {
            setNoteDetails(note);
            setConfirmMessage('Please enter a description for the support request before saving.');
            setShowOkButton(true);
            setDeleteOpen(true);
            return;
        }

        const now = new Date().toISOString();

        // ── EDIT MODE: update existing ticket ──
        if (editingTicket) {
            const ticketIdToUpdate = editingTicket.ticketid;
            const updatedTicket: ITicketDoc = {
                ...editingTicket,
                moreinfo: text,
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
                const updatePayload = {
                    moreinfo: text,
                    lastupdated: now,
                    monitorupdated: now,
                };
                const result = await updateTicket(ticketIdToUpdate, updatePayload as unknown as Record<string, unknown>);
                if (result && result.success !== false) {
                    await createActivityLogRef.current?.(`${cid} of ${bid} updated ticket ${ticketIdToUpdate} successfully.`);
                } else {
                    console.error('RequestSupportTickets: updateTicket failed', result?.error);
                }
            }
            return;
        }

        // ── CREATE MODE: create a new ticket ──
        const ticketid = `ticket_${Date.now()}`;
        const newTicket: ITicketDoc = {
            bid,
            cid,
            ticketid,
            tickettype: 'Support Request',
            subscription: '',
            mfg: '',
            eqtype: '',
            prodno: '',
            moreinfo: text,
            status: 'Pending',
            daterequested: now,
            datereleased: '',
            lastupdated: now,
            monitorupdated: now,
            monitor: false,
        };

        setTicketList((prev) => [newTicket, ...prev]);
        setOriginalTicketList((prev) => [newTicket, ...prev]);
        if (onSelectTicketRef.current) {
            onSelectTicketRef.current(newTicket);
        }
        resetEditor();

        const result = await createTicket(newTicket as unknown as Record<string, unknown>);
        if (result && result.success !== false) {
            await createActivityLogRef.current?.(`${cid} of ${bid} created ticket ${ticketid} successfully.`);
        } else {
            console.error('RequestSupportTickets: createTicket failed', result?.error);
        }
    }, [editingTicket, resetEditor, updateTicket, bid, cid, createTicket]);

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
        setConfirmMessage(`Are you sure you want to delete ticket ${ticket.ticketid || ''}?`);
        setShowOkButton(false);
        setDeleteOpen(true);
    };

    const handleConfirmDeleteYes = async () => {
        if (deleteItem) {
            const ticketIdToDelete = deleteItem.ticketid;
            setTicketList((prev) => prev.filter((item) => item.ticketid !== ticketIdToDelete));
            setOriginalTicketList((prev) => prev.filter((item) => item.ticketid !== ticketIdToDelete));
            if (editingTicket?.ticketid === ticketIdToDelete) {
                resetEditor();
            }
            if (selectedTicketRef.current?.ticketid === ticketIdToDelete && onSelectTicketRef.current) {
                onSelectTicketRef.current(null);
            }
            if (ticketIdToDelete) {
                const result = await deleteTicket(ticketIdToDelete);
                if (result && result.success !== false) {
                    await createActivityLogRef.current?.(`${cid} of ${bid} deleted ticket ${ticketIdToDelete} successfully.`);
                } else {
                    console.error('RequestSupportTickets: deleteTicket failed', result?.error);
                }
            }
        }
        setDeleteItem(null);
        setDeleteOpen(false);
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
                    <div className="nz-notes-list-scroll">
                        {ticketList.map((item, index) => {
                            const isSelected = editingTicket
                                ? editingTicket.ticketid === item.ticketid
                                : selectedTicket
                                    ? selectedTicket.ticketid === item.ticketid
                                    : index === 0;

                            const displayDate = item.lastupdated || item.daterequested;
                            const formattedDate = displayDate
                                ? FnConvertDateToUtcOrUtcToDate(displayDate, false, true)
                                : '';

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
                    <div className="nz-notes-container">
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
                                handleDelete={() => {}}
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
                handleYesButtonClick={handleConfirmDeleteYes}
                handleNoButtonClick={() => setDeleteOpen(false)}
                handleOkButtonClick={() => setDeleteOpen(false)}
            />
        </div>
    );
};

export { RequestSupportTickets };
export default RequestSupportTickets;