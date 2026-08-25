
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { CircularProgress } from '@mui/material';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { useSessionContext } from '../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';
import '../allcss/StatusBarContainer.css';
import { IStatusBarContainer, IStatusBarItem } from '../allinterface/IStatusBarContainer';
import { ISession } from '../../shared/context/allinterface/ISession';
import { IErrorData } from '../../shared/allinterface/IApiResponse';
import { Label } from '../../shared/basic/label/Label';
import { StatusBarCard } from './statusbarcard/StatusBarCard';
import { StatusBarTitleContainer } from './statusbartitlecontainer/StatusBarTitleContainer';
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { FnConvertDateToUtcOrUtcToDate } from '../allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnGetAppDateFormat } from '../../shared/allcommon/basic/FnGetAppDateFormat';
import { FnSortStatusBarCards } from '../allcommon/FnSortStatusBarCards';
import { IAlertProfileItem, IApItem } from '../../shared/context/allinterface/IMainApp';
import { FnParseJsonSafely } from '../allcommon/FnParseJsonSafely';

// Builds markdown content for error and log sections in status bar cards.
const generateErrorMarkdown = (errors: IErrorData[]): string => {
    // Formats timestamp into readable time with milliseconds.
    const extractTimeFromTimestamp = (timestamp?: string): string => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;
        const time = date.toLocaleTimeString(undefined, {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        const ms = String(date.getMilliseconds()).padStart(3, "0");
        const timeParts = time.split(" ");
        return `${timeParts[0]}.${ms} ${timeParts[1]}`;
    };
    if (!errors?.length) return "";
    // Take latest 15 entries
    const errorList = errors.filter(e => e.errCode > 0);
    const recent = [...errors].reverse().slice(0, 15);
    const logList = recent.filter(e => e.errCode <= 0);
    const formatItem = (err: IErrorData, index: number) =>
        `${index + 1}) ${extractTimeFromTimestamp(err.timeStamp)} — ${err.errString || JSON.stringify(err)
        }`;
    let result = "";
    if (errorList.length) {
        result += `**Errors**\n`;
        result += errorList.map(formatItem).join("\n");
    }
    if (logList.length) {
        if (result) result += "\n\n";
        result += `**Logs**\n`;
        result += logList.map(formatItem).join("\n");
    }
    return result;
};

// Renders and manages status bar cards, notifications, and resize behavior.
const StatusBarContainer = (statusBarContainerProps: IStatusBarContainer) => {
    const [statusBarTitle, setStatusBarTitle] = useState<string | string[]>();
    const [statusBarType, setStatusBarType] = useState<'error' | 'testapi' | 'useraction' | 'info'>('info');
    // new implementation for statusbar with card 
    const [statusBarCards, setStatusBarCards] = useState<IStatusBarItem[]>([]);
    const [isStatusBarOpen, setIsStatusBarOpen] = useState<boolean>(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [showOkButton, setShowOkButton] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isShowFullTitle, setIsShowFullTitle] = useState<boolean>(false);
    const [isInternetAvailable, setIsInternetAvailable] = useState<boolean>(true);
    const statusBarContext = useStatusBarContext();
    const { FetchDataError, FetchError, TestApiData, IsLoading, LoadingLabel, UserActionData, setFetchDataError, setFetchError, setUserActionData, setTestApiData } = statusBarContext;
    const [hasError, setHasError] = useState<number | undefined>(FetchDataError?.length || FetchError?.length);
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();

    const maxResizeHeightRef = useRef<number>(0);
    const sessionVarRef = useRef<ISession[]>(undefined);
    const alertProfileRef = useRef<IAlertProfileItem[]>(undefined);
    const dcimStatsRef = useRef<IApItem[]>(undefined);

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    });

    // Converts markdown body text into HTML for alert templates.
    const formatMarkdownToHTML = useCallback((text: string) => {
        return md.render(text);
    }, [md]);

    // Keeps session variables in a ref for stable access in async effects.
    useEffect(() => {
        sessionVarRef.current = sessionContext.SessionList;
    }, [sessionContext.SessionList]);

    // Extracts common tenant/team/tag names from current session values.
    const { tenantName, teamName, tagName } = useMemo(() => {
        sessionVarRef.current = sessionContext.SessionList;
        const list = sessionContext.SessionList ?? [];
        // Finds a session variable by case-insensitive variable name.
        const get = (n: string) =>
            list.find(i => i.VariableName?.toLowerCase() === n)?.SessionValue ?? undefined;
        return {
            tenantName: get("tenantname"),
            teamName: get("teamname"),
            tagName: get("tagname"),
        };
    }, [sessionContext.SessionList]);



    // Ensures alert profile records are available for notification rendering.
    useEffect(() => {
        if (mainAppContext.alertProfileRecords.length) {
            alertProfileRef.current = mainAppContext.alertProfileRecords;
        }
        else {
            mainAppContext.fetchAlertProfileRecords(statusBarContext);
        }
    }, [mainAppContext.alertProfileRecords])

    // Adds incoming alert records as status bar cards for current user visibility.
    useEffect(() => {
        if (mainAppContext.alertRecords.length) {
            const statusBarCardList: IStatusBarItem[] = [];
            const currentUserName = sessionVarRef.current?.find((item) => item.VariableName === "LoginShortName");
            for (let index = 0; index < mainAppContext.alertRecords.length; index++) {
                const element = mainAppContext.alertRecords[index];
                let userNames: string[] = [];
                if (element.UsersToNotifyJson) {
                }
                else if (element.HTML) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(element.HTML, "text/html");
                    let form = doc.querySelector("#userList");
                    if (form) {
                        userNames = Array.from(form.querySelectorAll('input[type="hidden"]'))
                            .map((input) => (input as HTMLInputElement).value);
                    }
                }
                const isExists = statusBarCards.find((item) => item.titleData === element.AlertProfileName);
                if (!isExists && currentUserName?.SessionValue && (userNames.includes(currentUserName.SessionValue) || !userNames.length)) {
                    const statusBarCard: IStatusBarItem = {
                        duration: element.AlertSeverity?.toLowerCase() === "critical" ? 1000 : 5000,
                        cardPurpose: element.MessageSource,
                        severity: element.AlertSeverity,
                        titleData: element.AlertProfileName,
                        _AlertQueue: element._AlertQueue,
                        contentData: element.HTML,
                        alertProfileID: element.AlertProfileID,
                        escalationLevel: element.EscalationLevel,
                        attemptCount: element.AttemptCount,
                        html: element.HTML,
                        lastDelivered: element.LastDelivered,
                        lastUpdated: element.LastUpdated ? FnConvertDateToUtcOrUtcToDate(element.LastUpdated, false, true) : undefined,
                        entID: element.EntID,
                        recID: element.RecID,
                        messageSource: element.MessageSource
                    };
                    statusBarCardList.push(statusBarCard);
                }
            }
            if (statusBarCardList.length) {
                const statusBarCardLists = FnSortStatusBarCards([...statusBarCardList.reverse(), ...statusBarCards]);
                setStatusBarCards(statusBarCardLists)
            }
        }
    }, [mainAppContext.alertRecords])

    // Polls session-open endpoint and shows timeout cards when session expires.
    // useEffect(() => {
    //     let isMounted = true;
    //     // Runs the periodic session validation API call silently.
    //     // const runUpdateGlobalStats = () => {
    //     //     if (!isMounted) return;
    //     //     axiosInterceptor(
    //     //         {
    //     //             url: SESSION.IsSessionOpen,
    //     //             data: {},
    //     //             callSilently: true,
    //     //             disableLog: true,
    //     //             setFetchData: async (isSessionOpenResponse: unknown, status?: string, errData?: IErrorData[]) => {
    //     //                 if (status !== "200" && errData?.length) {
    //     //                     const statusBarContent = generateErrorMarkdown(errData);
    //     //                     const statusBarCard: IStatusBarItem = {
    //     //                         duration: 10000,
    //     //                         cardPurpose: 'Timeout',
    //     //                         severity: 'Critical',
    //     //                         titleData: "Session Timeout",
    //     //                         contentData: statusBarContent,
    //     //                         _AlertQueue: "Session Timeout"
    //     //                     };
    //     //                     const statusBarCardLists = FnSortStatusBarCards([statusBarCard, ...statusBarCards]);
    //     //                     setStatusBarCards(statusBarCardLists);
    //     //                 }
    //     //             }
    //     //         },
    //     //         statusBarContext
    //     //     ).catch(err => {
    //     //         console.warn("session expired", err);
    //     //     });
    //     // };
    //     // //  run immediately
    //     // runUpdateGlobalStats();
    //     //  run every 10 seconds
    //     // const intervalId = setInterval(runUpdateGlobalStats, 50000);
    //     return () => {
    //         isMounted = false;
    //         // clearInterval(intervalId);
    //     };
    // }, []);

    // Mirrors internet availability from main app context.
    useEffect(() => {
        setIsInternetAvailable(mainAppContext.isInternetAvailable)
    }, [mainAppContext.isInternetAvailable])

    // Mirrors lock/managed flags from current  properties.


    // Clears cached refs when status bar container unmounts.
    useEffect(() => {
        return () => {
            sessionVarRef.current = undefined;
            alertProfileRef.current = undefined;
            dcimStatsRef.current = undefined;
            maxResizeHeightRef.current = 0
        }
    }, [])


    // Collapses status bar panel while loader is active.
    useEffect(() => {
        if (IsLoading) {
            setIsStatusBarOpen(false);
        }
    }, [IsLoading])

    // Builds ordered status bar title lines from stats, session, and dynamic values.
    useEffect(() => {
        if (statusBarType !== "info") return;
        const data = statusBarContainerProps.statusBarData;
        const loginStatusLines = statusBarContext.statusBarStringData ?? [];

        if (data && typeof data !== "string") {
            const arr: string[] = [];
            // Upserts a "Label: Value" entry in-place by label key.
            const updateArray = (label: string, value: string | number | undefined | null) => {
                if (!value) return;
                const entry = `${label}: ${value}`;
                const idx = arr.findIndex((item) => item?.toLowerCase().startsWith(label?.toLowerCase() + ":"));
                if (idx >= 0) {
                    arr[idx] = entry; // replace existing
                } else {
                    arr.push(entry); // insert new
                }
            };

            for (const key in data) {

                const value = data[key]
                if (value) {
                    updateArray(key, value);
                }
            }

            // Always append login status lines (statusBarData is often `{}`).
            for (const loginLine of loginStatusLines) {
                if (loginLine && !arr.includes(loginLine)) {
                    arr.push(loginLine);
                }
            }

            setStatusBarTitle((prev) => {
                // if previous was array and same as new, do nothing
                if (
                    Array.isArray(prev) &&
                    prev.length === arr.length &&
                    prev.every((v, i) => v === arr[i])
                ) {
                    return prev;
                }
                return arr;
            });
        } else if (typeof data === "string" && data.length) {
            const titleLines = [data, ...loginStatusLines.filter((line) => line && line !== data)];
            setStatusBarTitle(titleLines.length === 1 ? titleLines[0] : titleLines);
        } else if (loginStatusLines.length) {
            setStatusBarTitle(loginStatusLines.length === 1 ? loginStatusLines[0] : loginStatusLines);
        } else {
            setStatusBarTitle(undefined);
        }
    }, [
        statusBarContainerProps.statusBarData,
        statusBarContainerProps.featureId,
        statusBarType,
        teamName,
        tenantName,
        tagName,
        statusBarContext.statusBarStringData
    ]);

    // Resizes expanded status bar by mouse/touch drag position.
    const handleMousemove = useCallback((e: MouseEvent | TouchEvent) => {
        const clientY = "touches" in e
            ? e.touches[0].clientY
            : e.clientY;
        const statusbarDiv: HTMLElement | null = document.querySelector('.nz-statusbar-container');
        const statusBarTitle: HTMLElement | null = document.querySelector('.nz-statusbar-error-action');
        if (!statusbarDiv) return;
        const offsetTop = document.body.offsetHeight - clientY;
        let minHeight = 50;
        if (statusBarTitle) {
            const titleHeight = statusBarTitle.getBoundingClientRect().height;
            minHeight = titleHeight + 55;
        }
        if (offsetTop > minHeight && offsetTop < maxResizeHeightRef.current) {
            statusbarDiv.style.setProperty("height", `${offsetTop}px`, "important");
        } else if (offsetTop < minHeight) {
            statusbarDiv.style.setProperty("height", `${minHeight}px`, "important");
        }
    }, []);

    // Stops resize drag listeners and removes drag visual state.
    const handleMouseup = useCallback(() => {
        document.removeEventListener("mousemove", handleMousemove, true);
        document.removeEventListener("mouseup", handleMouseup, true);
        document.removeEventListener("touchmove", handleMousemove);
        document.removeEventListener("touchend", handleMouseup, true);
        const element = document.getElementById('dragger');
        if (element) {
            element.classList?.remove("resizable");
        }
    }, [handleMousemove]);

    // Resets manual status bar height once API/test errors are cleared.
    useEffect(() => {
        if (!FetchDataError?.length && !TestApiData) {
            const statusbarDiv: HTMLElement | null = document.querySelector('.nz-statusbar-container');
            if (statusbarDiv) {
                statusbarDiv.style.removeProperty("height");
            }
        }
    }, [FetchDataError, TestApiData]);

    // Creates error/fetch alert queue entries and status bar cards from API failures.
    useEffect(() => {
        // Adds generated status bar content to alert queue for persistence/escalation.
        // const callApiToAddAlertQueue = (alertProfile: IAlertProfileItem, htmlToUpdate: string) => {
        //     axiosInterceptor(
        //         {
        //             url: ALERT.AddToAlertQueue,
        //             data: {
        //                 "alertQueueName": "",
        //                 "messageSource": "Error",
        //                 "message": htmlToUpdate,
        //                 "alertSeverity": "Critical",
        //                 "alertProfileName": alertProfile._AlertProfile,
        //                 "entID": null,
        //                 "entityName": ""
        //             },
        //             callSilently: true,
        //             setFetchData: (
        //                 addTableRecordApiResponse: unknown,
        //                 status?: string
        //             ) => {
        //                 if (status === "200" &&
        //                     addTableRecordApiResponse &&
        //                     typeof addTableRecordApiResponse === "object" &&
        //                     "alertJson" in addTableRecordApiResponse
        //                 ) {
        //                     try {
        //                         const parsedData = FnParseJsonSafely(
        //                             addTableRecordApiResponse.alertJson as string
        //                         ) as IAlertQueueApiItem[];
        //                         if (parsedData && Array.isArray(parsedData) && parsedData.length) {
        //                             const statusBarCardList: IStatusBarItem[] = [];
        //                             for (let index = 0; index < parsedData.length; index++) {
        //                                 const element = parsedData[index];
        //                                 const isExists = statusBarCards.find((item) => item.titleData === element.AlertProfileName && item._AlertQueue === element._AlertQueue);
        //                                 if (!isExists && element.AlertProfileID) {
        //                                     const statusBarCard: IStatusBarItem = {
        //                                         duration: element.AlertSeverity?.toLowerCase() === "critical" ? 1000 : 5000,
        //                                         cardPurpose: element.MessageSource ?? "Error",
        //                                         severity: (element.AlertSeverity as IStatusBarItem["severity"]) ?? "Critical",
        //                                         titleData: element.AlertProfileName ?? "",
        //                                         _AlertQueue: element._AlertQueue ?? "",
        //                                         contentData: element.HTML,
        //                                         alertProfileID: element.AlertProfileID,
        //                                         escalationLevel: element.EscalationLevel,
        //                                         attemptCount: element.AttemptCount,
        //                                         html: element.HTML,
        //                                         lastDelivered: element.LastDelivered,
        //                                         lastUpdated: element.LastUpdated ? FnConvertDateToUtcOrUtcToDate(element.LastUpdated, false, true) : undefined,
        //                                         entID: element.EntID,
        //                                         recID: element.RecID,
        //                                         messageSource: element.MessageSource
        //                                     };
        //                                     statusBarCardList.push(statusBarCard);
        //                                 }
        //                             }
        //                             if (statusBarCardList.length) {
        //                                 const statusBarCardLists = FnSortStatusBarCards([...statusBarCardList, ...statusBarCards]);
        //                                 setStatusBarCards(statusBarCardLists)
        //                             }
        //                         }
        //                     } catch (error) {
        //                         console.error(
        //                             "Failed to parse JSON or extract EntID:",
        //                             error
        //                         );
        //                     }
        //                 }
        //             }
        //         },
        //         statusBarContext
        //     ).catch((error) => {
        //         console.error("Failed to add alert queue entry", error);
        //     });
        // }
        /*
         * Wraps the message in the alert profile template when one exists,
         * otherwise falls back to the plain markdown body.
         */
        const buildCardContent = (profileName: string, markdownContent: string): string => {
            const alertProfile = mainAppContext.alertProfileRecords?.find((item) => item._AlertProfile === profileName);
            if (!alertProfile?.HTML) {
                return markdownContent;
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(alertProfile.HTML, "text/html");
            // Insert message into a div
            let msgDiv = doc.querySelector("#messageContent"); // Example target div with id
            if (!msgDiv) {
                // If div doesn’t exist, create one at the end of body
                msgDiv = doc.createElement("div");
                msgDiv.id = "messageContent";
                doc.body.appendChild(msgDiv);
            }
            msgDiv.innerHTML = formatMarkdownToHTML(markdownContent);
            // Convert back to string
            return doc.body.innerHTML;
            // callApiToAddAlertQueue(alertProfile, updatedHTML);
        };
        // Shows the error locally because the alert queue API is not called.
        const addErrorCard = (profileName: string, cardContent: string) => {
            if (!cardContent) return;
            const statusBarCard: IStatusBarItem = {
                duration: 10000,
                cardPurpose: 'Error',
                severity: 'Critical',
                titleData: profileName,
                _AlertQueue: profileName,
                contentData: cardContent,
                html: cardContent,
                messageSource: "Error",
                lastUpdated: FnConvertDateToUtcOrUtcToDate(new Date().toISOString(), false, true)
            };
            setStatusBarCards((prevCards) => {
                const isExists = prevCards.some((card) =>
                    card.cardPurpose === 'Error' && card.contentData === cardContent
                );
                if (isExists) return prevCards;
                return FnSortStatusBarCards([statusBarCard, ...prevCards]);
            });
        };
        if (FetchDataError?.length) {
            const isSessionTimeout = FetchDataError.find((item) => item.errCode.toString() === "16");
            if (isSessionTimeout) {
                if (isConfirmOpen)
                    return;
                setConfirmMessage(`${isSessionTimeout.errString} Click OK to reload the page`);
                setShowOkButton(true);
                setIsConfirmOpen(true);
                return
            }
            const statusBarContent = generateErrorMarkdown(FetchDataError);
            addErrorCard("DataError", buildCardContent("DataError", statusBarContent));
        }
        else if (FetchError?.length) {
            // Formats network error list as markdown bullet points.
            const generateNetworkErrorMarkdown = (errors: string[]): string => {
                if (!errors || errors.length === 0) return '';
                return errors
                    .map((err) => `- **${err}**`)
                    .join('\n');
            };
            const statusBarContent = generateNetworkErrorMarkdown(FetchError);
            addErrorCard("FetchError", buildCardContent("FetchError", statusBarContent));
        }
    }, [FetchDataError, FetchError])

    // Formats and appends test API results into status bar cards.
    useEffect(() => {
        // Attempts to parse a JSON string and returns raw string on failure.
        const tryParseJson = (str: string): unknown => {
            try {
                return FnParseJsonSafely(str);
            } catch {
                return str;
            }
        };
        // Recursively formats nested objects and embedded JSON strings.
        const formatObjectRecursive = (obj: unknown): string => {
            if (typeof obj === 'string') {
                const parsed = tryParseJson(obj);
                if (parsed !== obj) {
                    // parsed successfully — pretty-print inner JSON
                    return JSON.stringify(parsed, null, 2);
                }
                return obj;
            } else if (typeof obj === 'object' && obj !== null) {
                // Recursively format each property
                const formattedEntries = Object.entries(obj).map(([key, val]) => {
                    return `"${key}": ${formatObjectRecursive(val)}`;
                });
                return `{\n${formattedEntries.join(',\n')}\n}`;
            } else {
                return JSON.stringify(obj);
            }
        };
        // Converts API test payload/response data into markdown table or blocks.
        const formatApiCallToMarkdown = (data: string): string => {
            try {
                const parsedData = FnParseJsonSafely(data) as unknown;
                if (Array.isArray(parsedData)) {
                    // Handle arrays of strings or primitives
                    if (parsedData.every(item => typeof item !== 'object' || item === null)) {
                        return parsedData.map(item => `- ${String(item)}`).join('\n');
                    }
                    // Get all unique keys across the array
                    const allKeys = Array.from(
                        new Set(
                            parsedData.flatMap(item =>
                                typeof item === 'object' && item !== null ? Object.keys(item) : []
                            )
                        )
                    );
                    const header = `| ${allKeys.join(' | ')} |\n| ${allKeys.map(() => ':---').join(' | ')} |`;
                    const rows = parsedData.map((entry: unknown) => {
                        if (typeof entry !== 'object' || entry === null) {
                            // Non-object fallback row
                            return `| ${allKeys.map(() => '').join(' | ')} |`;
                        }
                        const rowEntry = entry as Record<string, unknown>;
                        const values = allKeys.map(key => {
                            const value = rowEntry[key];
                            if (typeof value === 'string') {
                                if (value.startsWith('http')) {
                                    return value;
                                }
                                return value;
                            } else if (typeof value === 'boolean') {
                                return value ? '✅ Yes' : '❌ No';
                            } else if (value == null) {
                                return '';
                            } else {
                                return String(value);
                            }
                        });
                        return `| ${values.join(' | ')} |`;
                    });
                    return [header, ...rows].join('\n');
                }
                else {
                    if (!parsedData || typeof parsedData !== "object") {
                        return String(parsedData ?? "");
                    }
                    const parsedObject = parsedData as Record<string, unknown>;
                    const maxLines = 1000;
                    const payloadString = JSON.stringify(parsedObject.payload, null, 2) || '{}';
                    const responseString = formatObjectRecursive(parsedObject.response) || '{}';
                    // Truncates long formatted blocks to keep status card readable.
                    const truncate = (text: string): string => {
                        const lines = text.split('\n');
                        if (lines.length <= maxLines) return text;
                        const truncatedLines: string[] = [];
                        for (let i = 0; i < maxLines; i++) {
                            truncatedLines.push(lines[i]);
                        }
                        return (
                            truncatedLines.join('\n') +
                            `\n... [truncated after ${maxLines} lines]`
                        );
                    };
                    const lines: string[] = [];
                    if (parsedObject.preflight) {
                        lines.push(`***${String(parsedObject.preflight)}***\n\n`);
                    }
                    if (parsedObject.url) {
                        const urlText = String(parsedObject.url);
                        lines.push(`**URL:** [${urlText}](${urlText})\n`);
                    }
                    lines.push(`**Payload:**`);
                    lines.push('```json');
                    lines.push(truncate(payloadString));
                    lines.push('```');
                    lines.push(`**Response:**`);
                    lines.push('```json');
                    lines.push(truncate(responseString));
                    lines.push('```');
                    return lines.join('\n');
                }
            } catch (error) {
                console.error("Failed to format test API markdown", error);
                return data;
            }
        };
        if (TestApiData) {
            const statusBarContent = formatApiCallToMarkdown(TestApiData);
            const statusBarCard: IStatusBarItem = {
                duration: 10000,
                cardPurpose: 'testapi',
                severity: 'Normal',
                titleData: "Test API Results",
                contentData: statusBarContent,
                _AlertQueue: "Test API Results"
            };
            const statusBarCardLists = FnSortStatusBarCards([statusBarCard, ...statusBarCards]);
            setStatusBarCards(statusBarCardLists);
        }
    }, [TestApiData])

    // Adds user action notifications as normal severity status cards.
    useEffect(() => {
        if (UserActionData) {
            const statusBarCard: IStatusBarItem = {
                duration: 10000,
                cardPurpose: 'useraction',
                severity: 'Normal',
                titleData: UserActionData,
                _AlertQueue: "Normal"
            };
            const statusBarCardLists = FnSortStatusBarCards([statusBarCard, ...statusBarCards]);
            setStatusBarCards(statusBarCardLists);
        }
    }, [UserActionData])

    // Closes a single card and persists close status for error alerts.
    const handleCloseCard = (id: string, cardItem: IStatusBarItem) => {
        if (cardItem.cardPurpose === "Error") {
            setFetchDataError(null);
            setFetchError(null);
        }
        else if (cardItem.cardPurpose === "testapi") {
            setTestApiData(undefined);
        }
        else if (cardItem.cardPurpose === "useraction") {
            setUserActionData(undefined);
        }
        // if (cardItem.cardPurpose === "Error") {
        //     const alertQueue = {
        //         _AlertQueue: [{
        //             AlertProfileName: cardItem.titleData,
        //             MessageSource: cardItem.messageSource,
        //             AlertProfileID: cardItem.alertProfileID,
        //             EscalationLevel: cardItem.escalationLevel,
        //             AttemptCount: cardItem.attemptCount,
        //             AlertSeverity: cardItem.severity,
        //             _AlertQueue: cardItem._AlertQueue,
        //             HTML: cardItem.html,
        //             EntityName: "AlertQueue",
        //             IsClosed: true,
        //             EntID: cardItem.entID,
        //             RecID: cardItem.recID
        //         }]
        //     };
        //     axiosInterceptor(
        //         {
        //             url: EM.AddUpdateTableRecord,
        //             data: {
        //                 entityName: "AlertQueue",
        //                 jsonString: JSON.stringify(alertQueue)
        //             },
        //             setFetchData: (
        //                 addTableRecordApiResponse: unknown,
        //                 status?: string
        //             ) => {
        //                 if (status === "200" &&
        //                     addTableRecordApiResponse &&
        //                     typeof addTableRecordApiResponse === "object" &&
        //                     "jsonStringOutput" in addTableRecordApiResponse
        //                 ) {
        //                     try {
        //                     } catch (error) {
        //                         console.error(
        //                             "Failed to parse JSON or extract EntID:",
        //                             error
        //                         );
        //                     }
        //                 }
        //             }
        //         },
        //         statusBarContext
        //     ).catch((error) => {
        //         console.error("Failed to close alert queue row", error);
        //     });
        // }
        // call API to set close status 
        setStatusBarCards((prevCards) =>
            prevCards.filter(
                (card) =>
                    !(
                        card.cardPurpose === cardItem.cardPurpose &&
                        card.severity === cardItem.severity &&
                        card.titleData === cardItem.titleData &&
                        card.entID === cardItem.entID
                    )
            )
        );
    };

    // Closes all closeable alert queue entries and clears status sources.
    const closeAllAlertQueue = () => {
        if (statusBarCards.length) {
            const profiles: Record<string, unknown>[] = [];
            // Builds current UTC date text in app-configured date format.
            const getCurrentUtc = () => {
                const now = new Date();
                // Pads numeric date parts to two digits.
                const pad = (n: number) => n.toString().padStart(2, "0");
                const format = FnGetAppDateFormat()?.toUpperCase(); // normalize to uppercase
                const dateInput =
                    format === "MM/DD/YYYY"
                        ? `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
                        : `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                return FnConvertDateToUtcOrUtcToDate(dateInput, true, true);
            };
            const currentDate = getCurrentUtc();
            for (let index = 0; index < statusBarCards.length; index++) {
                const element = statusBarCards[index];
                if (element.cardPurpose?.toLowerCase() !== "testapi" && element.cardPurpose?.toLowerCase() !== "timeout" && element.cardPurpose?.toLowerCase() !== "info" && element.cardPurpose?.toLowerCase() !== "useraction") {
                    profiles.push({
                        AlertProfileName: element.titleData,
                        MessageSource: element.messageSource,
                        AlertProfileID: element.alertProfileID,
                        EscalationLevel: element.escalationLevel,
                        AttemptCount: element.attemptCount,
                        AlertSeverity: element.severity,
                        _AlertQueue: element._AlertQueue,
                        HTML: element.html,
                        EntityName: "AlertQueue",
                        IsClosed: 1,
                        EntID: element.entID,
                        RecID: element.recID,
                        LastDelivered: element.cardPurpose?.toLowerCase() === "error" ? currentDate : undefined
                    })
                }
                else {
                    setFetchDataError(null);
                    setFetchError(null);
                    setTestApiData(undefined);
                }
            }
            // if (profiles.length) {
            //     const alertQueue = {
            //         _AlertQueue: profiles
            //     };
            //     axiosInterceptor(
            //         {
            //             url: EM.UpdateEntityRecords,
            //             data: {
            //                 entityName: "AlertQueue",
            //                 jsonString: JSON.stringify(alertQueue)
            //             },
            //             setFetchData: (
            //                 addTableRecordApiResponse: unknown,
            //                 status?: string
            //             ) => {
            //                 if (status === "200" &&
            //                     addTableRecordApiResponse &&
            //                     typeof addTableRecordApiResponse === "object" &&
            //                     "jsonStringOutput" in addTableRecordApiResponse
            //                 ) {
            //                     try {
            //                     } catch (error) {
            //                         console.error(
            //                             "Failed to parse JSON or extract EntID:",
            //                             error
            //                         );
            //                     }
            //                 }
            //             }
            //         },
            //         statusBarContext
            //     ).catch((error) => {
            //         console.error("Failed to close all alert queues", error);
            //     });
            // }
        }
    }

    // Handles clear action with critical-alert confirmation safeguard.
    const handleClearClick = async () => {
        if (statusBarCards.length && statusBarCards.find((item) => item.severity === "Critical")) {
            setShowOkButton(false);
            setIsConfirmOpen(true);
            setConfirmMessage("Are you sure you wish to clear all notifications?");
        }
        else {
            closeAllAlertQueue();
            setStatusBarCards([]);
            setIsStatusBarOpen(false);
            setFetchDataError(null);
            setTestApiData(undefined);
            setUserActionData(undefined);
        }
    }

    // Keeps open/error state synchronized with current card collection.
    useEffect(() => {
        if (statusBarCards.length === 0) {
            setIsStatusBarOpen(false);
            setFetchDataError(null);
            setTestApiData(undefined);
            setUserActionData(undefined);
        }
        else {
            const hasCritical = statusBarCards.find((item) => item.severity === "Critical");
            if (hasCritical) {
                setHasError(1);
            }
            else {
                setHasError(undefined);
            }
        }
    }, [statusBarCards])

    // Confirms clear action and resets all status state.
    const handleClickYesButton = async () => {
        setFetchError(null);
        setFetchDataError(null);
        closeAllAlertQueue();
        setStatusBarCards([]);
        setIsConfirmOpen(false);
        setIsStatusBarOpen(false);
    }

    return (
        <div id="StatusBarContainer" key={statusBarContainerProps.uniqueName} className={`nz-statusbar-container ${isStatusBarOpen ? "nz-statusbar-container-open" : ""}`}>
            <div className={`nz-statusbar-content ${IsLoading ? "nz-loading" : ""}`}>
                {IsLoading && (
                    <div className='nz-statusbar-loader'>
                        <CircularProgress size={24} />
                        <Label uniqueName={`${statusBarContainerProps.uniqueName}-label-loading`}
                            label={LoadingLabel ?? 'Loading...'} />
                    </div>
                )}
                {!IsLoading ? <div className={`nz-statusbar-card-container`}>
                    <div className='nz-statusbar-container-title'>
                        <StatusBarTitleContainer
                            uniqueName={`${statusBarContainerProps.uniqueName}-statusbarinfo`}
                            isError={hasError ? true : false}
                            titleData={statusBarCards.length ? statusBarCards[0].titleData : statusBarTitle ?? ""}
                            isOpen={isStatusBarOpen}
                            cardsCount={statusBarCards.length}
                            isShowFullTitle={isShowFullTitle}
                            isInternetAvailable={isInternetAvailable}
                            criticalAlertCount={statusBarCards.filter(card => card.severity === "Critical").length}
                            handleOpenCloseStatusBar={() => {
                                setIsStatusBarOpen(!isStatusBarOpen);
                            }}
                            handleShowFullTitle={() => {
                                setIsShowFullTitle(!isShowFullTitle);
                            }}
                            handleClearClick={handleClearClick}
                        />
                    </div>
                    {statusBarCards.length ? <div className='nz-statusbar-card-content'>
                        {statusBarCards.map((cardItem: IStatusBarItem, index) => {
                            return <React.Fragment key={index}> <StatusBarCard
                                {...cardItem}
                                uniqueName={`card-item-${index}`}
                                id={cardItem.titleData}
                                handleCloseClick={(id: string) => {
                                    handleCloseCard(id, cardItem);
                                }} /></React.Fragment>
                        })}
                    </div> : <></>}
                </div> : <></>}
                <YesNoFormContainer
                    isOpen={isConfirmOpen}
                    uniqueName={statusBarContainerProps.uniqueName + "confirmbox"}
                    message={confirmMessage}
                    showOkButton={showOkButton}
                    handleYesButtonClick={handleClickYesButton}
                    handleNoButtonClick={() => {
                        setIsConfirmOpen(false);
                    }}
                    handleOkButtonClick={
                        () => {
                            setIsConfirmOpen(false);
                            window.location.reload();
                        }
                    } />
            </div>
        </div>
    );
};
export { StatusBarContainer };
