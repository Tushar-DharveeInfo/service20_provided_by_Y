
//create uri from source and file type 
function FnCreateDisplayUri(source: string, fileType: string = "png") {
    if (fileType === "svg") {
        fileType = `${fileType}+xml`;
    }
    return `data:image/${fileType};base64,${source}`;
}

export {FnCreateDisplayUri}