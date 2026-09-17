import { useCallback, useState } from 'react'
import { useFileUpload } from '@n20a/libfsdb'
import type { IUploadSingleFileResult } from '@n20a/libfsdb'

/*
Usage:

  const { upload, uploading, progress, error } = useUploadRemoteFile()

  await upload({
    source: fileInputRef.current.files[0], // or a Blob, or a blobUrl string
    bucket: 'n20-bucket-01',
    baseFolder: 'sm',
    fileName: 'reports/report.pdf',
  })

Note: when `source` is a blobUrl string, the caller created it and must call
URL.revokeObjectURL(blobUrl) once done with it — this hook never revokes it.
*/

/** A blob url (string) or an already-available File/Blob (e.g. from an &lt;input type=file&gt;). */
export type TUploadRemoteFileSource = string | File | Blob;

export interface IUploadRemoteFileParams {
    source: TUploadRemoteFileSource;
    bucket: string;
    baseFolder: string;
    /** Destination file name (with extension), also used as the uploaded File's name. */
    fileName: string;
    /** Overrides the auto-detected MIME type from the source File/Blob. */
    contentType?: string;
}

export interface IUseUploadRemoteFileResult {
    upload: (params: IUploadRemoteFileParams) => Promise<IUploadSingleFileResult>;
    uploading: boolean;
    progress: number;
    error: string | null;
}

const resolveSourceToFile = async (
    source: TUploadRemoteFileSource,
    fileName: string,
    contentType?: string
): Promise<File> => {
    // blobUrl: caller owns its lifecycle, this hook never revokes it.
    if (typeof source === 'string') {
        const response = await fetch(source)
        const blob = await response.blob()
        return new File([blob], fileName, { type: contentType ?? blob.type })
    }

    if (source instanceof File && !contentType && source.name === fileName) {
        return source
    }

    return new File([source], fileName, { type: contentType ?? source.type })
}

/* Uploads a file to Cloud Storage from a blobUrl, File or Blob, reusing useFileUpload for progress/transport. */
const useUploadRemoteFile = (): IUseUploadRemoteFileResult => {
    const { uploadSingleFile, uploading, progress } = useFileUpload()
    const [error, setError] = useState<string | null>(null)

    const upload = useCallback(async (params: IUploadRemoteFileParams): Promise<IUploadSingleFileResult> => {
        const { source, bucket, baseFolder, fileName, contentType } = params
        const storagePath = `${bucket}/${baseFolder}/${fileName}`
        setError(null)

        try {
            const file = await resolveSourceToFile(source, fileName, contentType)
            const result = await uploadSingleFile(file, storagePath)

            if (!result?.success) {
                throw new Error(result?.error ?? result?.message ?? `Unable to upload remote file: ${storagePath}`)
            }

            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to upload remote file.'
            setError(message)
            throw err
        }
    }, [uploadSingleFile])

    return { upload, uploading, progress, error }
}

export { useUploadRemoteFile }
