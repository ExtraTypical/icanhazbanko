import Box from "./box/box.mjs"
import Picture from "./box/pictures.mjs"
import assert from 'node:assert'
import { Readable } from "node:stream"

export default async (req) => {
    // const { next_run } = await req.json()
    // console.log("Received event! Next invocation at:", next_run)

    const box = new Box()
    const picture = new Picture()
    const heicFiles = await box.listItemsInFolder(process.env.BOX_HEIC_FOLDER_ID)
    const convertedFiles = await box.listItemsInFolder(process.env.BOX_FOLDER_ID)

    /** Error handling for heicFiles response / handling for total_count = 0 */
    switch (true) {
        case (heicFiles === undefined): {
            const error = "items returned as undefined, which means there was a problem with the call"
            console.error(error)
            return error
        }
        case (heicFiles.total_count === undefined): {
            const error = "items.total_count is equal to undefined, meaning that there's something wrong with the payload"
            console.error(error)
            return error
        }
        case (heicFiles?.total_count === 0): {
            const message = "Total count of files is equal to 0, so there are no photos to update."
            console.log(message)
            return message
        }
        case (heicFiles?.entries === undefined): {
            const error = "Entries are undefined, meaning there's a problem with the payload"
            console.error(error)
            return error
        }
    }
    /** Error handling for convertedFiles */
    switch (true) {
        case (convertedFiles === undefined): {
            const error = "items returned as undefined, which means there was a problem with the call"
            console.error(error)
            return error
        }
        case (convertedFiles.total_count === undefined): {
            const error = "items.total_count is equal to undefined, meaning that there's something wrong with the payload"
            console.error(error)
            return error
        }
    }

    const heicFilesArray = []
    for (let i = 0; i < heicFiles?.entries?.length; i++) {
        /** Struct for easy review */
        let itemStruct = {
            type: "string",
            id: "string",
            etag: "string",
            name: "string"
        }
        if (heicFiles?.entries[i]?.name?.includes(".")) {
            let trimmedName = heicFiles?.entries[i].name.split(".")[0]
            heicFilesArray.push({
                id: heicFiles?.entries[i].id,
                name: heicFiles?.entries[i].name,
                trimmedName: trimmedName,
                type: heicFiles?.entries[i].type
            })
        }
    }

    const convertedFilesArray = []
    if (convertedFiles.entries.length !== 0) {
        for (let i = 0; i < convertedFiles?.entries?.length; i++) {
            /** Struct for easy review */
            let itemStruct = {
                type: "string",
                id: "string",
                etag: "string",
                name: "string"
            }
            if (convertedFiles?.entries[i]?.name?.includes(".")) {
                let trimmedName = convertedFiles?.entries[i].name.split(".")[0]
                convertedFilesArray.push({
                    id: convertedFiles?.entries[i].id,
                    name: convertedFiles?.entries[i].name,
                    trimmedName: trimmedName,
                    type: convertedFiles?.entries[i].type
                })
            }
        }
    }

    const uniqueFiles = [];

    heicFilesArray.forEach((heicItem) => {
        const matchingConvertedItem = convertedFilesArray.find(
            (convertedItem) => heicItem.trimmedName === convertedItem.trimmedName
        );

        if (!matchingConvertedItem) {
            uniqueFiles.push(heicItem);
        }
    });

    for (let i = 0; i < uniqueFiles.length; i++) {
        let file = uniqueFiles[i]
        let base64img
        let fileURL
        switch (true) {
            case (file?.name?.endsWith(".heic")): {
                fileURL = await box.getFile(file.id)
                assert(fileURL !== undefined, "FileURL is undefined")
                base64img = await picture.convertHeicUrlToJpgBase64(fileURL)
                break;
            }
            case (file?.name?.endsWith(".png")): {
                fileURL = await box.getFile(file.id)
                assert(fileURL !== undefined, "FileURL is undefined")
                base64img = await picture.convertPngToJpgBase64(fileURL)
                break;
            }
            case (file?.name?.endsWith(".jpg") || file?.name?.endsWith(".jpeg")): {
                fileURL = await box.getFile(file.id)
                assert(fileURL !== undefined, "FileURL is undefined")
                base64img = await picture.convertPngToJpgBase64(fileURL)
                break;
            }
            default: {
                console.error("File is an unrecognized type, will skip", file)
                break;
            }
        }
        var base64Buffer = Buffer.from(base64img, 'base64');
        // we are using just Readable to create a stream, but you can use any library you want
        var stream = new Readable()
        stream._read = () => {
            stream.push(base64Buffer);
            stream.push(null);
        };
        // you have to pass options and define content length
        var options = {
            content_length: Buffer.byteLength(base64img, 'base64')
        };
        const newName = file.trimmedName + ".jpg"
        const result = await box.uploadFile(newName, base64Buffer, options)
        console.log(result)
    }
    return
}