import { useCallback, useMemo } from 'react';
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm';
import { DisplayControlEnums } from '../../../shared/alldefaultprops/basic/DefaultPropsFormContainer';
import { IControl } from '../../../shared/allinterface/settingsform/ISettingsLibForm';
import { Label } from '../../../shared/basic/label/Label';
import { useBusinessTickets } from '@n20a/libfsdb';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import type { INoteItems } from '../../../shared/allinterface/sidebar/IFqaNotes';
import type { ITicketDoc } from '@n20a/libfsdb';
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
}: IRequestSupportFormProps) => {
    const mainAppContext = useMainAppContext();
    const { setIsLoading } = useStatusBarContext();
    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? '').trim();
    const cid = String(authSession?.cid ?? '').trim();
    const { updateTicket } = useBusinessTickets(bid);

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
                    await mainAppContext.createActivityLog(
                        `${cid} of ${bid} updated ticket ${ticketIdToUpdate} successfully.`
                    );
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

    return (
        <div className="nz-request-support-form-container nz-wh-100" key={uniqueName}>
            <SettingsLibForm
                key={`${uniqueName}-${noteId}-${isClosed ? 'closed' : 'open'}`}
                id={noteId}
                uniqueName={`${uniqueName}-fc`}
                controls={controls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={headerTitle}
                isDisableForm={isClosed}
                isAutoSave={false}
                handleSaveForm={handleSaveForm}
            />
        </div>
    );
};

export { RequestSupportForm, buildSupportControls };
export type { IRequestSupportFormData, IRequestSupportFormProps };
export default RequestSupportForm;
