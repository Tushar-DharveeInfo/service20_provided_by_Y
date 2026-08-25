
import { useCallback, useEffect, useMemo, useState } from "react"
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown.ts';
import { Notes } from "@n20a/libavnotes"
import type { INote } from "@n20a/libavnotes"
import { Delete24x24, Info24x24 } from "@n20a/libicon"
import './AppQaContactUs.css'
import '../../../shared/sidebar/notes/FqaNotes.css'
import '@n20a/libavnotes/style.css'
import { Label } from "../../../shared/basic/label/Label.tsx"
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable.ts"
import { Image } from "../../../shared/basic/image/Image.tsx"
import type { ITreeNode } from "../../../shared/allinterface/entity/ITreeNode.ts"
import notesSampleData from '../../../../serviceSampledata/sidebar/NotesSampleData.json'
const { sampleNotesEntityRecordsResponse } = notesSampleData;
import { FnHandleAPIResponse } from "../../../shared/allcommon/basic/FnHandleAPIResponse.ts"
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts"
import { FilterKeywordControl } from "../../../shared/searchfilter/filterkeywordcontrol/FilterKeywordControl.tsx"
import { ActionImage } from "../../../shared/basic/actionimage/ActionImage.tsx"
import { YesNoFormContainer } from "../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx"
import type { IImage } from "../../../shared/allinterface/basic/IImage.ts"

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

/*
 * ContactUs copy of the sidebar FqaNotes component.
 * It intentionally uses the same note editor, list, search, delete confirmation,
 * sample response, class names and local add/delete behavior as the sidebar.
 */
const ContactUsNotes = ({ uniqueName, selectedNode, onSelectNote, selectedNoteItem, isAppQa }: IContactUsNotes) => {
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

    const resetEditor = useCallback(() => {
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
        setRefreshToken((value) => value + 1);
    }, []);

    useEffect(() => {
        const parsedData = FnHandleAPIResponse(
            sampleNotesEntityRecordsResponse,
            "Dataset"
        );
        const sampleNotes =
            typeof parsedData === "object"
                && parsedData !== null
                && Array.isArray((parsedData as Record<string, unknown>)["PG.Notes"])
                ? (parsedData as Record<string, Record<string, any>[]>)["PG.Notes"]
                : [];

        setNotesItems(sampleNotes);
        setOriginalNotesItems(sampleNotes);
        if (sampleNotes.length > 0 && onSelectNote && !selectedNoteItem) {
            onSelectNote(sampleNotes[0]);
        }
        resetEditor();
    }, [selectedNode, resetEditor, onSelectNote]);

    const sendNotes = useCallback((message: INote) => {
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

        let notesType = "Message";
        if (message.notevideo) notesType = "Video";
        else if (message.noteaudio) notesType = "Audio";
        else if (message.notefile) notesType = "Image";

        const newNote: Record<string, any> = {
            EntityName: selectedNode.NodeEntityname ?? "ContactUs",
            LastUpdated: new Date().toISOString(),
            NodeType: selectedNode.NodeType ?? "ContactUs",
            NotesMAX: noteText,
            NotesType: notesType,
            UserName: "demo.user",
            Status: "Accepted",
            ...(notesType !== "Message"
                ? { FileUID: `sample-file-${Date.now()}` }
                : {}),
        };

        setNotesItems((items) => [newNote, ...items]);
        setOriginalNotesItems((items) => [newNote, ...items]);
        resetEditor();
    }, [resetEditor, selectedNode]);

    const searchValueChange = (value: string) => {
        setSearchText(value);
        setLensDirty(Boolean(value.length));
        if (!value.length) {
            setNotesItems(originalNotesItems);
        }
    };

    const handleKeywordSearchResult = () => {
        const searchValue = searchText.toLowerCase();
        setNotesItems(
            originalNotesItems.filter((item) =>
                item.NotesMAX?.toLowerCase().includes(searchValue)
            )
        );
    };

    const handleDelete = (item: Record<string, any>) => {
        setDeleteItem(item);
        setConfirmMessage("Are you sure you want to delete this note?");
        setShowOkButton(false);
        setDeleteOpen(true);
    };

    const handleConfirmYesClick = () => {
        if (deleteItem) {
            setNotesItems((items) => items.filter((item) => item !== deleteItem));
            setOriginalNotesItems((items) =>
                items.filter((item) => item !== deleteItem)
            );
        }
        setDeleteItem(null);
        setDeleteOpen(false);
    };

    const handleDeleteAttachment = (
        _objectType: "file" | "audio" | "video",
        _objectData?: Blob | File
    ) => {
        // The sidebar API is intentionally disabled in this sample project.
        void _objectType;
        void _objectData;
    };

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

    return (
        <div className="nz-node-list-Container" key={uniqueName}>
            <div className="nz-notes-list-main-div">
                <div className="nz-notes-list-with-msg-box">
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
                    <div className="nz-notes-list-scroll">
                        {notesItems.map((item, index) => {
                            const isSelected = isAppQa ? false : selectedNoteItem
                                ? (selectedNoteItem.LastUpdated === item.LastUpdated && selectedNoteItem.NotesMAX === item.NotesMAX)
                                : index === 0;
                            return (
                                <div
                                    className={`nz-node-list-box ${isSelected ? "nz-node-list-box-selected" : ""}`}
                                    key={`${item.LastUpdated}-${index}`}
                                    onClick={() => onSelectNote?.(item)}
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
                                                label={`${FnConvertDateToUtcOrUtcToDate(
                                                    item.LastUpdated,
                                                    false,
                                                    true
                                                )}`}
                                            />
                                        </div>
                                        <div className="nz-note-user">
                                            <Label
                                                uniqueName={`${uniqueName}-user-${index}`}
                                                label={`${item.UserName}`}
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
                                                tooltip={item.NotesType}
                                            />
                                        </div>
                                        <div className="nz-nodes-text">
                                            <Label
                                                uniqueName={`${uniqueName}-note-${index}`}
                                                label={item.NotesMAX}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="nz-notes-container">
                        {noteDetails && (
                            <Notes
                                {...noteDetails}
                                key={refreshToken}
                                allowAudio={false}
                                allowVideo={false}
                                sendNote={sendNotes}
                                sendTooltip="Send Note"
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
