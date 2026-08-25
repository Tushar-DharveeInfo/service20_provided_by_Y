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

const createSupportControl = (
    name: string,
    label: string,
    sortOrder: number,
    displayControl: DisplayControlEnums,
    displayGroupControl: string = 'Request Details',
    isRequired: number = 0
): IControl => ({
    CanChange: 1,
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
    disabled: false,
    IsReadOnly: false,
});

const requestSupportControls: IControl[] = [
    createSupportControl('UserName', 'User Name', 1, DisplayControlEnums.EditTextControl),
    createSupportControl('LastUpdated', 'Date / Time', 2, DisplayControlEnums.EditTextControl),
    createSupportControl('NotesType', 'Note Type', 3, DisplayControlEnums.EditTextControl),
    createSupportControl('EntityName', 'Entity Name', 4, DisplayControlEnums.EditTextControl),
    createSupportControl('NodeType', 'Node Type', 5, DisplayControlEnums.EditTextControl),
    createSupportControl('NotesMAX', 'Notes / Description', 6, DisplayControlEnums.TextareaControl),
];

const RequestSupportForm = ({
    uniqueName = 'request-support-form',
    selectedNote,
    onSave,
}: IRequestSupportFormProps) => {
    // Converts selected card from left side pane into profile JSON string
    const profileString = useMemo(() => {
        if (!selectedNote) return '';
        const profileData: IRequestSupportFormData = {
            UserName: selectedNote.UserName ?? '',
            LastUpdated: selectedNote.LastUpdated ?? '',
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
    const headerTitle = `Details: ${selectedNote.NotesType || 'Note'} - ${selectedNote.UserName || 'User'}`;

    return (
        <div className="nz-request-support-form-container nz-wh-100" key={uniqueName}>
            <SettingsLibForm
                key={`${uniqueName}-${noteId}`}
                id={noteId}
                uniqueName={`${uniqueName}-fc`}
                controls={requestSupportControls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={headerTitle}
                isDisableForm={false}
                isAutoSave={false}
                handleSaveForm={handleSaveForm}
            />
        </div>
    );
};

export { RequestSupportForm, requestSupportControls };
export type { IRequestSupportFormData, IRequestSupportFormProps };
export default RequestSupportForm;
