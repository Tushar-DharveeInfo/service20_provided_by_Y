import { useCallback, useMemo, useState } from 'react';
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm';
import { DisplayControlEnums } from '../../../shared/alldefaultprops/basic/DefaultPropsFormContainer';
import { IControl } from '../../../shared/allinterface/settingsform/ISettingsLibForm';
import { Label } from '../../../shared/basic/label/Label';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { Delete24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../shared/allcommon/FnGetCssVariable';
import { useBusinessTickets, useFileDelete } from '@n20a/libfsdb';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { FnHideShowSaveIconForForm } from '../../../shared/allcommon/basic/FnHideShowSaveIconForForm';
import type { INoteItems } from '../../../shared/allinterface/sidebar/IFqaNotes';
import type { ITicketDoc } from '@n20a/libfsdb';
import type { IImage } from '../../../shared/allinterface/basic/IImage';
import './RequestSupport.css';

interface IRequestSupportFormData {
    UserName: string;
    LastUpdated: string;
    Status?: string;
    NotesType: string;
    EntityName: string;
    NodeType: string;
    NotesMAX: string;
    FileUID?: string;
}

interface IRequestSupportFormProps {
    uniqueName?: string;
    selectedNote?: INoteItems | null;
    selectedTicket?: ITicketDoc | null;
    onSave?: (savedData: IRequestSupportFormData) => void;
    onTicketUpdated?: (updatedTicket: ITicketDoc) => void;
    onTicketDeleted?: (ticketId: string) => void;
}

const isClosedStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return status.trim().toLowerCase() === 'closed';
};

const createSupportControl = (
    name: string,
    label: string,
    sortOrder: number,
    displayControl: DisplayControlEnums,
    displayGroupControl: string = 'Request Details',
    isEditable: boolean = false,
    isRequired: number = 0,
    options?: { label: string; value: string }[]
): IControl => ({
    CanChange: isEditable ? 1 : 0,
    IsRequired: isRequired,
    GroupName: 'RequestSupport',
    GroupNameDesc: displayGroupControl,
    SubGroupEntID: '',
    SubGroupName: 'FormControl',
    SubGroupNameDesc: '',
    _AP: name,
    PropertyLabel: label,
    NameDesc: label,
    DefaultAPValue: '',
    Value: '',
    ValueDesc: '',
    SortOrder: sortOrder,
    MaxInstances: 0,
    InputMask: '',
    RegEx: '',
    DisplayGroupControl: displayGroupControl,
    DisplayControl: displayControl,
    ChangeEvent: '',
    Secured: false,
    IsNZ: true,
    EntID: '',
    RecID: '',
    LastUpdated: '',
    EntityName: 'ContactUs',
    Name: name,
    disabled: !isEditable,
    IsReadOnly: !isEditable,
    Options: options,
});

const buildSupportControls = (status?: string | null): IControl[] => {
    const isClosed = isClosedStatus(status);
    const allowEditNotes = !isClosed;

    return [
        createSupportControl('UserName', 'User Name', 1, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('LastUpdated', 'Date / Time', 2, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('Status', 'Status', 3, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('NotesType', 'Note Type', 4, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('EntityName', 'Entity Name', 5, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('NodeType', 'Node Type', 6, DisplayControlEnums.TextControl, 'Request Details', false),
        createSupportControl('NotesMAX', 'Notes / Description', 7, DisplayControlEnums.TextareaControl, 'Request Details', allowEditNotes),
    ];
};

const RequestSupportForm = ({
    uniqueName = 'request-support-form',
    selectedNote,
    selectedTicket,
    onSave,
    onTicketUpdated,
    onTicketDeleted,
}: IRequestSupportFormProps) => {
    const mainAppContext = useMainAppContext();
    const { setIsLoading, setLoadingLabel } = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? '').trim();
    const cid = String(authSession?.cid ?? '').trim();
    const bucketName = authSession?.bucketName ?? 'n20-bucket-01';
    const baseFolder = authSession?.baseFolder ?? 'sm';

    const { updateTicket, deleteTicket } = useBusinessTickets(bid);
    const { deleteFiles } = useFileDelete();

    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

    const getStoragePath = useCallback((filename: string): string => {
        if (!filename) return '';
        if (filename.includes('/')) return filename;
        return `${bucketName}/${baseFolder}/smfiles/tickets/${filename}`;
    }, [bucketName, baseFolder]);

    // Unify either selectedTicket or selectedNote into a standard display record
    const activeItem = useMemo(() => {
        if (selectedTicket) {
            return {
                id: selectedTicket.ticketid,
                UserName: selectedTicket.ticketid || 'Ticket',
                LastUpdated: selectedTicket.lastupdated || selectedTicket.daterequested || '',
                Status: selectedTicket.status || 'Pending',
                NotesType: selectedTicket.tickettype || 'Support Request',
                EntityName: selectedTicket.mfg || selectedTicket.subscription || 'Ticket',
                NodeType: selectedTicket.eqtype || 'Support',
                NotesMAX: selectedTicket.moreinfo || '',
                FileUID: selectedTicket.prodno || '',
            };
        }
        if (selectedNote) {
            return {
                id: `${selectedNote.LastUpdated ?? ''}-${selectedNote.UserName ?? ''}`,
                UserName: selectedNote.UserName ?? '',
                LastUpdated: selectedNote.LastUpdated ?? '',
                Status: selectedNote.Status ?? 'Accepted',
                NotesType: selectedNote.NotesType ?? 'Message',
                EntityName: selectedNote.EntityName ?? 'ContactUs',
                NodeType: selectedNote.NodeType ?? 'ContactUs',
                NotesMAX: selectedNote.NotesMAX ?? '',
                FileUID: selectedNote.FileUID ?? '',
            };
        }
        return null;
    }, [selectedTicket, selectedNote]);

    const isClosed = isClosedStatus(activeItem?.Status);
    const controls = useMemo(() => buildSupportControls(activeItem?.Status), [activeItem?.Status]);

    // Converts selected card into profile JSON string
    const profileString = useMemo(() => {
        if (!activeItem) return '';
        const profileData: IRequestSupportFormData = {
            UserName: activeItem.UserName,
            LastUpdated: activeItem.LastUpdated,
            Status: activeItem.Status,
            NotesType: activeItem.NotesType,
            EntityName: activeItem.EntityName,
            NodeType: activeItem.NodeType,
            NotesMAX: activeItem.NotesMAX,
            FileUID: activeItem.FileUID,
        };
        return JSON.stringify([profileData]);
    }, [activeItem]);

    const handleSaveForm = useCallback(async (profileDataJson: string) => {
        let parsedData: Record<string, unknown> = {};
        try {
            const parsed = JSON.parse(profileDataJson);
            parsedData = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed;
        } catch {
            parsedData = { raw: profileDataJson };
        }

        const newNotes = String(
            parsedData.NotesMAX ??
            parsedData['Request Details_NotesMAX'] ??
            parsedData.moreinfo ??
            parsedData.message ??
            ''
        ).trim();

        if (selectedTicket?.ticketid) {
            const ticketIdToUpdate = selectedTicket.ticketid;
            const now = new Date().toISOString();
            const updatePayload = {
                moreinfo: newNotes,
                lastupdated: now,
                monitorupdated: now,
            };

            setIsLoading(true);
            try {
                const result = await updateTicket(ticketIdToUpdate, updatePayload as unknown as Record<string, unknown>);
                if (result && result.success !== false) {
                    FnHideShowSaveIconForForm('hide');
                    try {
                        await mainAppContext.createActivityLog(
                            `${cid} of ${bid} updated ticket ${ticketIdToUpdate} successfully.`
                        );
                    } catch (logErr) {
                        console.error('RequestSupportForm: createActivityLog failed on update', logErr);
                    }
                    const updatedTicket: ITicketDoc = {
                        ...selectedTicket,
                        moreinfo: newNotes,
                        lastupdated: now,
                        monitorupdated: now,
                    };
                    if (onTicketUpdated) {
                        onTicketUpdated(updatedTicket);
                    }
                } else {
                    console.error('RequestSupportForm: updateTicket failed', result?.error);
                }
            } catch (err) {
                console.error('RequestSupportForm: updateTicket error', err);
            } finally {
                setIsLoading(false);
            }
        }

        if (onSave) {
            onSave(parsedData as unknown as IRequestSupportFormData);
        }
    }, [selectedTicket, updateTicket, bid, cid, mainAppContext, onTicketUpdated, onSave, setIsLoading]);

    const handleDeleteIconClick = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        setIsDeleteOpen(true);
    }, []);

    const handleConfirmDeleteYes = useCallback(async () => {
        setIsDeleteOpen(false);

        const ticketIdToDelete = selectedTicket?.ticketid || activeItem?.id;
        if (!ticketIdToDelete) return;

        const rawFileName = String(
            selectedTicket?.prodno ||
            (selectedTicket as Record<string, any>)?.filename ||
            activeItem?.FileUID ||
            ''
        ).trim();

        setIsLoading(true);
        setLoadingLabel?.('Deleting ticket...');

        try {
            // 1. Delete Ticket document from Firestore
            const result = await deleteTicket(ticketIdToDelete);
            if (result && result.success !== false) {
                // 2. Delete attached file from cloud storage if present
                if (rawFileName && !rawFileName.startsWith('sample-file-')) {
                    try {
                        setLoadingLabel?.('Deleting attachment...');
                        const storagePath = getStoragePath(rawFileName);
                        await deleteFiles([storagePath]);
                    } catch (storageErr) {
                        console.warn('RequestSupportForm: Cloud storage file deletion failed', storageErr);
                    }
                }

                // 3. Create activity log for deleting ticket
                try {
                    await mainAppContext.createActivityLog(
                        `${cid} of ${bid} deleted ticket ${ticketIdToDelete} successfully.`
                    );
                } catch (logErr) {
                    console.error('RequestSupportForm: createActivityLog failed on delete', logErr);
                }

                // 4. Notify parent
                if (onTicketDeleted) {
                    onTicketDeleted(ticketIdToDelete);
                }
            } else {
                console.error('RequestSupportForm: deleteTicket failed', result?.error);
            }
        } catch (err) {
            console.error('RequestSupportForm: delete operation failed', err);
        } finally {
            setIsLoading(false);
            setLoadingLabel?.(undefined);
        }
    }, [selectedTicket, activeItem, deleteTicket, getStoragePath, deleteFiles, mainAppContext, cid, bid, onTicketDeleted, setIsLoading, setLoadingLabel]);

    const deleteImageData: IImage = useMemo(() => ({
        uniqueName: `${uniqueName}-header-delete-image`,
        source: (
            <Delete24x24
                size={FnGetCssVariable('--image-size-2')}
                fill="none"
                strokeWidth={1}
            />
        ),
        w: 'var(--image-size-2)',
        tooltip: 'Delete Ticket',
        type: 'svg',
    }), [uniqueName]);

    const headerDeleteAction = useMemo(() => {
        return (
            <ActionImage
                uniqueName={`${uniqueName}-header-delete-ai`}
                image={deleteImageData}
                w={'var(--node_height)'}
                h={'var(--node_height)'}
                actionCode={'delete'}
                tooltip="Delete Ticket"
                handleMouse={handleDeleteIconClick}
            />
        );
    }, [uniqueName, deleteImageData, handleDeleteIconClick]);

    if (!activeItem) {
        return (
            <div className="nz-request-support-empty-pane nz-wh-100 nz-d-flex-hv-left" style={{ padding: 'var(--spacing-2)' }}>
                <Label
                    uniqueName={`${uniqueName}-empty-label`}
                    label="Select a card from the list to view and edit details."
                />
            </div>
        );
    }

    const noteId = activeItem.id || `${activeItem.LastUpdated}-${activeItem.UserName}`;
    const statusSuffix = activeItem.Status ? ` [${activeItem.Status}]` : '';
    const headerTitle = `Details (${activeItem.UserName || 'Support Request'})${statusSuffix}`;
    const deleteConfirmMessage = activeItem.id
        ? `Are you sure you want to delete ticket ${activeItem.id}?`
        : 'Are you sure you want to delete this ticket?';

    return (
        <div className="nz-request-support-form-container nz-wh-100" key={uniqueName}>
            <SettingsLibForm
                key={`${uniqueName}-${noteId}-${activeItem.LastUpdated}-${isClosed ? 'closed' : 'open'}`}
                id={noteId}
                uniqueName={`${uniqueName}-fc`}
                controls={controls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={headerTitle}
                headerActions={headerDeleteAction}
                isDisableForm={isClosed}
                isAutoSave={false}
                handleSaveForm={handleSaveForm}
            />
            <YesNoFormContainer
                isOpen={isDeleteOpen}
                uniqueName={`${uniqueName}-confirm-delete`}
                message={deleteConfirmMessage}
                showOkButton={false}
                handleYesButtonClick={handleConfirmDeleteYes}
                handleNoButtonClick={() => setIsDeleteOpen(false)}
                handleOkButtonClick={() => setIsDeleteOpen(false)}
            />
        </div>
    );
};

export { RequestSupportForm, buildSupportControls };
export type { IRequestSupportFormData, IRequestSupportFormProps };
export default RequestSupportForm;
