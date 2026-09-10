import { useEffect, useRef } from 'react'
import { useFileDownload } from '@n20a/libfsdb'

export interface IUseLoadRemoteJsonOptions<T> {
    bucket: string;
    baseFolder: string;
    fileName: string;
    onSuccess: (data: T) => void;
    onError: (message: string) => void;
    /** Custom parser for the downloaded text, e.g. to tolerate malformed JSON. Defaults to JSON.parse. */
    parse?: (raw: string) => T;
}

/* Downloads and parses a .json file from Cloud Storage, discarding results if the caller unmounts mid-request. */
const useLoadRemoteJson = <T = unknown>(options: IUseLoadRemoteJsonOptions<T>): void => {
    const { downloadSingleFile } = useFileDownload()
    const { bucket, baseFolder, fileName } = options

    const onSuccessRef = useRef(options.onSuccess)
    const onErrorRef = useRef(options.onError)
    const parseRef = useRef(options.parse)
    onSuccessRef.current = options.onSuccess
    onErrorRef.current = options.onError
    parseRef.current = options.parse

    useEffect(() => {
        let isMounted = true
        const storagePath = `${bucket}/${baseFolder}/${fileName}`

        async function load() {
            try {
                const result = await downloadSingleFile(storagePath)
                if (!result?.success || !result.blobUrl) {
                    throw new Error(`Unable to load remote file: ${storagePath}`)
                }

                let data: T
                try {
                    const response = await fetch(result.blobUrl)
                    const raw = await response.text()
                    data = parseRef.current ? parseRef.current(raw) : JSON.parse(raw) as T
                } finally {
                    URL.revokeObjectURL(result.blobUrl)
                }

                if (isMounted) {
                    onSuccessRef.current(data)
                }
            } catch (error) {
                if (isMounted) {
                    const message = error instanceof Error ? error.message : 'Unable to load remote file.'
                    onErrorRef.current(message)
                }
            }
        }

        void load()

        return () => {
            isMounted = false
        }
    }, [downloadSingleFile, bucket, baseFolder, fileName])
}

export { useLoadRemoteJson }
