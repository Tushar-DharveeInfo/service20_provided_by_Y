import { useEffect, useRef } from 'react'
import { useFileDownload, } from '@n20a/libfsdb'

interface IUseDownloadMultipleVssfilesOptions {
    bucket: string;
    baseFolder: string;
    // Example formats: ['shape.vssx', 'vssfolder-01/avssx/3Ware_3Ware-Chassis-100 IP.vssx', 'n20-bucket-01/sm/vssfolder-01/a.vssx']
    fileNames: string[];
    onSuccess?: (downloadedFiles: string[]) => void;
    onError: (message: string) => void;
}

/* Downloads multiple non-JSON files from Cloud Storage and triggers browser downloads. */
const useDownloadMultipleVssfiles = (options: IUseDownloadMultipleVssfilesOptions): void => {

    const { bucket, baseFolder, fileNames } = options
    const { downloadMultipleFiles } = useFileDownload()

    const onSuccessRef = useRef(options.onSuccess)
    const onErrorRef = useRef(options.onError)
    onSuccessRef.current = options.onSuccess
    onErrorRef.current = options.onError

    useEffect(() => {
        let isMounted = true

        const cleanedNames = fileNames
            .map((name) => String(name ?? '').trim())
            .filter((name) => name.length > 0)

        if (cleanedNames.length === 0) {
            return () => {
                isMounted = false
            }
        }

        const pathToFileName = new Map<string, string>()

        const storagePaths = cleanedNames.map((name) => {
            const storagePath = name.startsWith(`${bucket}/`)
                ? name
                : `${bucket}/${baseFolder}/${name}`
            pathToFileName.set(storagePath, name)
            return storagePath
        })
// console.log('Y-DownloadMultiple Storage paths to download:', storagePaths)

        async function download() {
            let blobUrls: string[] = []

            try {
                const result = await downloadMultipleFiles(storagePaths)
                const files = (result?.files ?? []) as Array<{ storagePath: string; blobUrl: string }>

                if (!files.length) {
                    throw new Error(`Unable to download remote files (${storagePaths.length} requested).`)
                }

                blobUrls = files.map((file: { storagePath: string; blobUrl: string }) => file.blobUrl)

                for (const file of files) {
                    const sourceName = pathToFileName.get(file.storagePath) ?? file.storagePath
                    const downloadName = sourceName.split('/').pop() || 'download'
                    const link = document.createElement('a')
                    link.href = file.blobUrl
                    link.download = downloadName
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
/*
                    const sourceName = pathToFileName.get(file.storagePath) ?? file.storagePath
                    const downloadName = sourceName.split('/').pop() || 'download'
*/

                if (isMounted) {
                    onSuccessRef.current?.(files.map((file: { storagePath: string; blobUrl: string }) => {
                      const sourceName = pathToFileName.get(file.storagePath) ?? file.storagePath
                      const downloadName = sourceName.split('/').pop() || 'download'
                      return downloadName
                    }))
                }
            } catch (error) {
                if (isMounted) {
                    const message = error instanceof Error ? error.message : 'Unable to download remote files.'
                    onErrorRef.current(message)
                }
            } finally {
                blobUrls.forEach((blobUrl) => URL.revokeObjectURL(blobUrl))
            }
        }

        void download()

        return () => {
            isMounted = false
        }
    }, [ bucket, baseFolder, fileNames])
}

export { useDownloadMultipleVssfiles, type IUseDownloadMultipleVssfilesOptions }
