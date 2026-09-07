import { useEffect, useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import parse from 'html-react-parser'
import { Download24x24, N, Visio } from '@n20a/libicon'
import { useFileList, useFileDownload } from '@n20a/libfsdb'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import downloadNetZoomFilesRaw from './DownloadNetZoomFiles.json'
import { Label } from '../../../shared/basic/label/Label.tsx'

interface IDownloadFeature {
	uniqueName: string; // uniqueName for the control and required
	featureId: string; // feature id
	headerText?: string; // header text coming from the selected menu item
	handleShowUserMessage?: (messageText: string) => void;
}

export interface IDownloadFileRecord {
	GroupName?: string
	Topic?: string
	Markdown?: string
	Filename?: string
	path?: string
	bid?: string
	cid?: string
	[key: string]: unknown
}

const md = new MarkdownIt({ html: false })

const normalizeGroupName = (groupName: string): string => groupName.toLowerCase().replace(/\s+/g, '')

const renderGroupIcon = (groupName: string) => {
	const normalized = normalizeGroupName(groupName)

	if (normalized === 'netzoom') {
		return <N size={24} />
	}

	if (normalized === 'visiostencils' || normalized === 'vsiostencils') {
		return <Visio size={24} />
	}

	return <N size={24} />
}

const DownloadNetZoom = (downloadNetZoomProps: IDownloadFeature) => {
	const rawHeaderText = downloadNetZoomProps.headerText ?? 'Download NetZoom'
	const headerTitle = rawHeaderText.startsWith('[')
		? rawHeaderText
		: `[Services] ${rawHeaderText}`

	// Extract logged-in user's bid and cid
	const mainAppContext = useMainAppContext()
	const userInfo = mainAppContext.userInfoAndSubscription?.userInfo
	const bid = String(userInfo?.bid ?? '').trim()
	const cid = String(userInfo?.cid ?? '').trim()

	// 1. Hook from @n20a/libfsdb to list files and display cards (Example 5)
	const {
		files,
		loading: listLoading,
		error: listError,
		listFiles,
	} = useFileList()

	console.log('error', listError)
	// 2. Hook from @n20a/libfsdb to download files (Example 5)
	const {
		downloading,
		error: downloadError,
		downloadSingleFile,
	} = useFileDownload()

	// Storage path based on bid and cid of login user
	const storagePath = useMemo(() => {
		// if (bid && cid) return `businesses/${bid}/${cid}/documents`
		if (bid) return `businesses/${bid}/documents`
		return 'downloads/netzoom'
	}, [bid, cid])

	// Load files on mount or when storage path changes
	useEffect(() => {
		void listFiles(storagePath)
	}, [storagePath, listFiles])

	const defaultRecords = downloadNetZoomFilesRaw
	useEffect(() => {

		console.log('files', files)
		console.log('listError', listError)
	}, [files, listError])
	// Map cloud files from files?.files or use default cards
	const cardItems = useMemo<IDownloadFileRecord[]>(() => {
		const cloudFileList: any[] = Array.isArray(files?.files) ? files.files : []

		if (cloudFileList.length > 0) {
			const cloudCards = cloudFileList.map((file: any) => {
				const isVisio = file.name.toLowerCase().includes('visio')
				return {
					GroupName: isVisio ? 'Visio Stencils' : 'NetZoom',
					Topic: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
					Markdown: `### ${file.name}\n\nSize: ${(file.size / 1024).toFixed(2)} KB\nUpdated: ${file.updated ? new Date(file.updated).toLocaleString() : ''}`,
					Filename: file.name,
					path: file.path || `${storagePath}/${file.name}`,
					bid,
					cid,
				}
			})

			const existingNames = new Set(cloudCards.map((c) => c.Filename?.toLowerCase()))
			const remainingDefaults = defaultRecords
				.filter((r) => !existingNames.has(r.Filename?.toLowerCase()))
				.map((r) => ({
					...r,
					path: r.Filename ? `${storagePath}/${r.Filename}` : '',
					bid,
					cid,
				}))

			return [...cloudCards, ...remainingDefaults]
		}

		return defaultRecords.map((r) => ({
			...r,
			path: r.Filename ? `${storagePath}/${r.Filename}` : '',
			bid,
			cid,
		}))
	}, [files, defaultRecords, storagePath, bid, cid])

	// Handle file download using useFileDownload from @n20a/libfsdb (Example 5)
	const handleDownload = async (record: IDownloadFileRecord) => {
		const fileName = record.Filename?.trim() || `${record.Topic || 'document'}.pdf`
		const filePath = record.path || `${storagePath}/${fileName}`

		try {
			// Call downloadSingleFile hook from @n20a/libfsdb
			const result = await downloadSingleFile(filePath)

			if (result && result.blobUrl) {
				const a = document.createElement('a')
				a.href = result.blobUrl
				a.download = fileName
				document.body.appendChild(a)
				a.click()
				a.remove()

				setTimeout(() => URL.revokeObjectURL(result.blobUrl!), 100)
				downloadNetZoomProps.handleShowUserMessage?.(`Downloaded ${fileName} successfully.`)
				return
			}

			if (result && result.signedUrl) {
				const a = document.createElement('a')
				a.href = result.signedUrl
				a.download = fileName
				a.target = '_blank'
				a.rel = 'noopener noreferrer'
				document.body.appendChild(a)
				a.click()
				a.remove()

				downloadNetZoomProps.handleShowUserMessage?.(`Downloaded ${fileName} successfully.`)
				return
			}

			// If file is not yet in cloud bucket, download card details as JSON file
			const cardDetails = {
				GroupName: record.GroupName ?? '',
				Topic: record.Topic ?? '',
				Markdown: record.Markdown ?? '',
				Filename: record.Filename ?? '',
				bid: record.bid || bid,
				cid: record.cid || cid,
				downloadedAt: new Date().toISOString(),
			}
			const blob = new Blob([JSON.stringify(cardDetails, null, 2)], { type: 'application/json' })
			const blobUrl = URL.createObjectURL(blob)
			const downloadFileName = fileName.endsWith('.json')
				? fileName
				: `${(record.Topic || 'card').replace(/\s+/g, '_').toLowerCase()}_details.json`

			const a = document.createElement('a')
			a.href = blobUrl
			a.download = downloadFileName
			document.body.appendChild(a)
			a.click()
			a.remove()

			setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
			downloadNetZoomProps.handleShowUserMessage?.(`Downloaded ${downloadFileName}.`)
		} catch (err) {
			console.error('Download failed:', err)
			const message = err instanceof Error ? err.message : `Download failed for ${fileName}.`
			downloadNetZoomProps.handleShowUserMessage?.(message)
		}
	}

	return (
		<section
			aria-label='Download NetZoom files'
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				overflowY: 'auto',
				maxHeight: 'calc(100vh - 220px)',
			}}
		>
			<div>
				<div className="nz-sub-header">
					<div className="nz-d-flex-row nz-align-center">
						<Label
							uniqueName={`${downloadNetZoomProps.uniqueName}-main-header`}
							label={headerTitle}
							fontWeight="600"
						/>
					</div>
				</div>
				<div className="nz-sub-header">
					<div className="nz-d-flex-row nz-align-center">
						<Label
							uniqueName={`${downloadNetZoomProps.uniqueName}-files-header`}
							label={"NetZoom Files"}
							fontWeight="600"
						/>
					</div>
				</div>
			</div>

			<style>
				{`.nz-download-netzoom-markdown > * { margin-top: 0; margin-bottom: 0.5rem; }
.nz-download-netzoom-markdown > *:last-child { margin-bottom: 0; }
.nz-download-netzoom-icon-wrap, .nz-download-netzoom-icon-wrap * { box-sizing: border-box; }`}
			</style>

			{listLoading && cardItems.length === 0 ? (
				<div style={{ padding: '1rem', color: 'var(--textsecondary, #6b7280)' }}>
					Loading files...
				</div>
			) : null}

			{listError && cardItems.length === 0 ? (
				<div style={{ padding: '1rem', color: 'red' }}>
					Error: {listError}
				</div>
			) : null}

			{cardItems.map((record, index) => {
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
								disabled={downloading}
								onClick={() => { void handleDownload(record) }}
								style={{
									border: 'none',
									background: 'transparent',
									padding: 0,
									margin: 0,
									cursor: downloading ? 'not-allowed' : 'pointer',
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

			{downloadError && (
				<div style={{ color: 'red', padding: '0.5rem 0' }}>
					Download Error: {String(downloadError)}
				</div>
			)}
		</section>
	)
}

export { DownloadNetZoom }
export default DownloadNetZoom
