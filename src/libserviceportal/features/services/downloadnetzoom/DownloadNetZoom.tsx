
import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import parse from 'html-react-parser'
import { Download24x24, N, Visio } from '@n20a/libicon'
import { FnGetPublicAssetUrl } from '../../allcommon/FnGetPublicAssetUrl.ts'
import downloadNetZoomFilesRaw from './DownloadNetZoomFiles.json?raw'   //The ?raw suffix is a bundler feature (commonly Vite) that changes how the file is imported: instead of parsing JSON into an object automatically, it imports the file as a plain text string. 
import { Label } from '../../../shared/basic/label/Label.tsx'

interface IDownloadFeature {
	uniqueName: string; // uniqueName for the control and required
	featureId: string; // feature id
	headerText?: string; // header text coming from the selected menu item
	handleShowUserMessage?: (messageText: string) => void;
}

interface IDownloadFileRecord {
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

	if (normalized === 'visiostencils' || normalized === 'vsiostencils') {
		return <Visio size={24} />
	}

	return <N size={24} />
}

const DownloadNetZoom = (downloadNetZoomProps: IDownloadFeature) => {
	const rawHeaderText = downloadNetZoomProps.headerText ?? 'Download NetZoom';
	const headerTitle = rawHeaderText.startsWith('[')
		? rawHeaderText
		: `[Services] ${rawHeaderText}`
	const records = useMemo(() => parseDownloadRecords(downloadNetZoomFilesRaw), [])

	const onClickDownload = async (record: IDownloadFileRecord): Promise<void> => {
		const fileName = record.Filename?.trim()

		if (!fileName) {
			downloadNetZoomProps.handleShowUserMessage?.('No file is configured for this card.')
			return
		}

		const fileUrl = FnGetPublicAssetUrl(fileName)
		const picker = (window as Window & {
			showDirectoryPicker?: () => Promise<any>
		}).showDirectoryPicker

		if (!picker) {
			const link = document.createElement('a')
			link.href = fileUrl
			link.download = fileName
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
			const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
			const writable = await fileHandle.createWritable()

			await writable.write(blob)
			await writable.close()

			downloadNetZoomProps.handleShowUserMessage?.(`Downloaded ${fileName} to selected folder.`)
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return
			}

			const message = error instanceof Error
				? error.message
				: `Download failed for ${fileName}.`
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
							uniqueName={`${downloadNetZoomProps.uniqueName}-main-header`}
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
			{records.map((record, index) => {
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
		</section>
	)
}

export { DownloadNetZoom }
export default DownloadNetZoom
