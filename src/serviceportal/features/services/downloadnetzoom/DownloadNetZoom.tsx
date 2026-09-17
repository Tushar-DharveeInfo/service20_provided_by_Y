
import { useEffect, useMemo, useState } from 'react'
import MarkdownIt from 'markdown-it'
import parse from 'html-react-parser'
import { Download24x24, N, Visio } from '@n20a/libicon'
import { useFileDownload, useFirestore } from '@n20a/libfsdb'
import { useLoadRemoteJson } from '../../../shared/allcommon/LoadRemoteJsonHooks'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks'
import { FnDistinctProductKeys } from '../../../shared/allcommon/FnDistinctValues'

const NETZOOM_FILES_BUCKET = 'n20-bucket-01'
const NETZOOM_FILES_BASE_FOLDER = 'sm'
const NETZOOM_FILES_FILENAME = 'netzoomdownloadfiles/netzoomdownloadfiles.json'

interface IDownloadFeature {
	uniqueName: string; // uniqueName for the control and required
	featureId: string; // feature id
	headerText?: string; // header text coming from the selected menu item
	handleShowUserMessage?: (messageText: string) => void;
}

interface IDownloadFileRecord {
  ProductKey:string
	GroupName?: string
	Topic?: string
	Markdown?: string
	Filename?: string
}

const md = new MarkdownIt({ html: false })

const parseDownloadRecords = (raw: string): IDownloadFileRecord[] => {
	try {
		const normalized = raw.replace(/,\s*([}\]])/g, '$1')
		const parsed = JSON.parse(normalized) as unknown

		return Array.isArray(parsed) ? parsed as IDownloadFileRecord[] : []
	} catch {
		return []
	}
}

const normalizeGroupName = (groupName: string): string => groupName.toLowerCase().replace(/\s+/g, '')

const renderGroupIcon = (groupName: string) => {
	const normalized = normalizeGroupName(groupName)

	if (normalized === 'netzoom') {
		return <N size={24} />
	}

	if (normalized === 'visiostencils') {
		return <Visio size={24} />
	}

	return <N size={24} />
}

const DownloadNetZoom = (downloadNetZoomProps: IDownloadFeature) => {
	const rawHeaderText = downloadNetZoomProps.headerText ?? 'Download NetZoom Files';
	const headerTitle = rawHeaderText.startsWith('[')
		? rawHeaderText
		: `[Services] ${rawHeaderText}`
	const { getDownloadUrl } = useFileDownload()
	const { queryDocuments } = useFirestore()
	const [records, setRecords] = useState<IDownloadFileRecord[]>([])
	const [loadError, setLoadError] = useState<string | null>(null)
  const [distinctProductKeys, setDistinctProductKeys] = useState<string[]>([])
  
const mainContext = useMainAppContext()

	useLoadRemoteJson<IDownloadFileRecord[]>({
		bucket: NETZOOM_FILES_BUCKET,
		baseFolder: NETZOOM_FILES_BASE_FOLDER,
		fileName: NETZOOM_FILES_FILENAME,
		parse: parseDownloadRecords,
		onSuccess: (parsedRecords) => 
    {
			setRecords(parsedRecords)
			setLoadError(null)
		},
		onError: (message) => {
			setLoadError(message)
			setRecords([])
		},
	})

  /* Yadav-uncomment this block when actual subs are available

	useEffect(() => {
		let isMounted = true

		const loadDistinctProductKeys = async () => {
			const bid = mainContext.authSession?.bid
			if (!bid) {
				if (isMounted) {
					setDistinctProductKeys([])
				}
				return
			}

			const keys = await FnDistinctProductKeys(bid, queryDocuments)
			if (isMounted) {
				setDistinctProductKeys(keys)
			}
		}

		void loadDistinctProductKeys()

		return () => {
			isMounted = false
		}
	}, [mainContext.authSession?.bid, queryDocuments])

	const filteredRecords = useMemo(() => {
		if (distinctProductKeys.length === 0) {
			return []
		}

		return records.filter((record) => distinctProductKeys.includes(record.ProductKey))
	}, [records, distinctProductKeys])

*/

/*Yadav-Comment this line when actual subs are available */
const filteredRecords = records;


	useEffect(() => {
		if (loadError) {
			downloadNetZoomProps.handleShowUserMessage?.(loadError)
		}
	}, [loadError, downloadNetZoomProps])

	const onClickDownload = async (record: IDownloadFileRecord): Promise<void> => {
		const fileName = record.Filename?.trim()

		if (!fileName) {
			downloadNetZoomProps.handleShowUserMessage?.('No file is configured for this card.')
			return
		}

		console.log('Downloading file:', fileName)

		const storagePath = `${NETZOOM_FILES_BUCKET}/${NETZOOM_FILES_BASE_FOLDER}/${fileName}`
		const urlResult = await getDownloadUrl(storagePath)

		if (!urlResult?.success || !urlResult.downloadUrl) {
			downloadNetZoomProps.handleShowUserMessage?.(`Unable to get download URL for ${fileName}.`)
			return
		}

		const fileUrl = urlResult.downloadUrl
		// getFileHandle rejects names containing path separators, so strip any folder prefix from fileName
		const localFileName = fileName.split(/[\\/]/).pop() || fileName
		const picker = (window as Window & {
			showDirectoryPicker?: () => Promise<any>
		}).showDirectoryPicker

		if (!picker) {
			const link = document.createElement('a')
			link.href = fileUrl
			link.download = localFileName
			link.rel = 'noopener noreferrer'
			document.body.appendChild(link)
			link.click()
			link.remove()
			return
		}

		try {
			const directoryHandle = await picker()
			const response = await fetch(fileUrl)

			if (!response.ok) {
				throw new Error(`Unable to download ${fileName}.`)
			}

			const blob = await response.blob()
			const fileHandle = await directoryHandle.getFileHandle(localFileName, { create: true })
			const writable = await fileHandle.createWritable()

			await writable.write(blob)
			await writable.close()

      // after successful download, log activity for the download
      const activityMessage = `${mainContext.authSession?.username} of ${mainContext.authSession?.bid} of downloaded "${localFileName}" to selected folder.`
      mainContext.createActivityLog(activityMessage)
      
      // After download, notify the user that the file has been downloaded successfully
			downloadNetZoomProps.handleShowUserMessage?.(`Downloaded "${localFileName}" to selected folder.`)
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return
			}

			const message = error instanceof Error
				? error.message
				: `Download failed for "${localFileName}".`
			downloadNetZoomProps.handleShowUserMessage?.(message)
		}
	}

	return (
		<section
			aria-label='Download NetZoom Files'
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				flex: 1,
				height: '100%',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<div>
				<div className="nz-sub-header">
					<div className="nz-d-flex-row nz-align-center">
						<Label
							uniqueName={`${downloadNetZoomProps.uniqueName}-main-header-title`}
							label={headerTitle}
							fontWeight="600"
						/>
					</div>
				</div>
				<div className="nz-sub-header">
					<div className="nz-d-flex-row nz-align-center">
						<Label
							uniqueName={`${downloadNetZoomProps.uniqueName}-main-header-netzoom-files`}
							label={"NetZoom Files"}
							fontWeight="600"
						/>
					</div>
				</div>

			</div>
			<style>
				{`.nz-download-netzoom-markdown > * { margin-top: 0; margin-bottom: 0.5rem; }
.nz-download-netzoom-markdown > *:last-child { margin-bottom: 0; }
.nz-download-netzoom-markdown h1, .nz-download-netzoom-markdown h2, .nz-download-netzoom-markdown h3,
.nz-download-netzoom-markdown h4, .nz-download-netzoom-markdown h5, .nz-download-netzoom-markdown h6 {
	font-size: inherit;
	font-weight: 600;
	line-height: inherit;
}
.nz-download-netzoom-markdown p, .nz-download-netzoom-markdown li, .nz-download-netzoom-markdown span {
	font-size: inherit;
	font-weight: normal;
	line-height: inherit;
}
.nz-download-netzoom-markdown ul, .nz-download-netzoom-markdown ol {
	margin: 0 0 0.5rem 0;
	padding-left: 1.25rem;
}
.nz-download-netzoom-icon-wrap, .nz-download-netzoom-icon-wrap * { box-sizing: border-box; }`}
			</style>
			<div
				style={{
					flex: 1,
					minHeight: 0,
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem'
				}}
			>
				{filteredRecords.map((record, index) => {
					const groupName = record.GroupName?.trim() ?? ''
					const topic = record.Topic?.trim() || 'Untitled'
					const markdown = record.Markdown ?? ''

					return (
						<article
							key={`${groupName}-${topic}-${index}`}
							style={{
								border: '1px solid var(--borderdivider, #d7dde2)',
								borderRadius: '0.75rem',
								padding: '4px',
								boxShadow: '0 8px 24px rgba(16, 24, 40, 0.08)',
								background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)'
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: '0.75rem',
									marginBottom: '0.75rem'
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
									<span
										aria-label={`${groupName || 'unknown'} icon`}
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										{renderGroupIcon(groupName)}
									</span>
									<h3
										style={{
											margin: 0,
											fontSize: '1rem',
											lineHeight: 1.3,
											color: 'var(--textprimary, #111827)'
										}}
									>
										{topic}
									</h3>
								</div>

								<button
									type='button'
									title='Download'
									aria-label={`Download ${topic}`}
									onClick={() => { void onClickDownload(record) }}
									style={{
										border: 'none',
										background: 'transparent',
										padding: 0,
										margin: 0,
										cursor: 'pointer',
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										lineHeight: 0,
										color: 'initial',
										fontSize: 'initial',
										fontFamily: 'initial',
										fontWeight: 'initial'
									}}
								>
									<span
										className='nz-download-netzoom-icon-wrap'
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											lineHeight: 0,
											color: 'var(--textprimary, #111827)'
										}}
									>
										<Download24x24
											size={18}
											fill='none'
											stroke='var(--textprimary, #111827)'
											strokeWidth={1.8}
										/>
									</span>
								</button>
							</div>

							<div
								className='nz-download-netzoom-markdown'
								style={{
									color: 'var(--textsecondary, #374151)',
									fontSize: '0.95rem',
									lineHeight: 1.5
								}}
							>
								{parse(md.render(markdown))}
							</div>
						</article>
					)
				})}
			</div>
		</section>
	)
}

export { DownloadNetZoom }
export default DownloadNetZoom
