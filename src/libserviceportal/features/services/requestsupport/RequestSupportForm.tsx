import { useMemo } from 'react';
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm';
import { DisplayControlEnums } from '../../../shared/alldefaultprops/basic/DefaultPropsFormContainer';
import { IControl } from '../../../shared/allinterface/settingsform/ISettingsLibForm';
import { Label } from '../../../shared/basic/label/Label';
import type { INoteItems } from '../../../shared/allinterface/sidebar/IFqaNotes';
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
    selectedNote: INoteItems | null;
    onSave?: (savedData: IRequestSupportFormData) => void;
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
    onSave,
}: IRequestSupportFormProps) => {
    const isClosed = isClosedStatus(selectedNote?.Status);
    const controls = useMemo(() => buildSupportControls(selectedNote?.Status), [selectedNote?.Status]);

    // Converts selected card from left side pane into profile JSON string
    const profileString = useMemo(() => {
        if (!selectedNote) return '';
        const profileData: IRequestSupportFormData = {
            UserName: selectedNote.UserName ?? '',
            LastUpdated: selectedNote.LastUpdated ?? '',
            Status: selectedNote.Status ?? 'Accepted',
            NotesType: selectedNote.NotesType ?? 'Message',
            EntityName: selectedNote.EntityName ?? 'ContactUs',
            NodeType: selectedNote.NodeType ?? 'ContactUs',
            NotesMAX: selectedNote.NotesMAX ?? '',
            FileUID: selectedNote.FileUID ?? '',
        };
        return JSON.stringify([profileData]);
    }, [selectedNote]);

    const handleSaveForm = (profileDataJson: string) => {
        let parsedData: Record<string, unknown> = {};
        try {
            const parsed = JSON.parse(profileDataJson);
            parsedData = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed;
        } catch {
            parsedData = { raw: profileDataJson };
        }

        if (onSave) {
            onSave(parsedData as unknown as IRequestSupportFormData);
        }

        alert('Updated Support Request Data:\n\n' + JSON.stringify(parsedData, null, 2));
    };

    if (!selectedNote) {
        return (
            <div className="nz-request-support-empty-pane nz-wh-100 nz-d-flex-hv-left" style={{ padding: 'var(--spacing-2)' }}>
                <Label
                    uniqueName={`${uniqueName}-empty-label`}
                    label="Select a card from the list to view and edit details."
                />
            </div>
        );
    }

    const noteId = `${selectedNote.LastUpdated ?? ''}-${selectedNote.UserName ?? ''}`;
    const statusSuffix = selectedNote.Status ? ` [${selectedNote.Status}]` : '';
    const headerTitle = `Details (${selectedNote.UserName || 'demo.user'})${statusSuffix}`;

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
