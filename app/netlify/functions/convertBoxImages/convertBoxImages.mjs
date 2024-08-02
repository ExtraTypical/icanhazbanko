import 'dotenv/config'
import assert from 'node:assert'
import BoxSDK from 'box-node-sdk'
import { Readable } from "node:stream"
import convert from 'heic-convert'
import Jimp from 'jimp'
class Box {
    constructor() {
        assert(process.env.BOX_CLIENT_ID !== undefined, "Client ID is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(process.env.BOX_CLIENT_SECRET !== undefined, "Client Secret is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(process.env.BOX_PUBLIC_KEY_ID !== undefined, "Public Key ID is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(process.env.BOX_PRIVATE_KEY !== undefined, "Private Key is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(process.env.BOX_PASSPHRASE !== undefined, "Passphrase is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(process.env.BOX_USER_ID !== undefined, "User ID is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")

        this.userID = process.env.BOX_USER_ID
        this.enterpriseID = process.env.BOX_ENTERPRISE_ID
        this.folderID = process.env.BOX_FOLDER_ID

        this.config = {
            clientID: process.env.BOX_CLIENT_ID,
            clientSecret: process.env.BOX_CLIENT_SECRET,
            appAuth: {
                keyID: process.env.BOX_PUBLIC_KEY_ID,
                privateKey: process.env.BOX_PRIVATE_KEY,
                passphrase: process.env.BOX_PASSPHRASE
            }
        }
        this.sdk = new BoxSDK(this.config)
        this.client = this.sdk.getAppAuthClient('enterprise', this.enterpriseID)

    }
    async listItemsInFolder(folderID, offset) {
        /**
         * ```js
         * const TypeItemsStruct = {
         *  total_count: 0,
                entries: [
                    {
                        type: 'file',
                        id: "12345",
                        etag: "0",
                        name: ""
        
                    }
                ],
                offset: 0,
                limit: 25,
                order: [
                    { by: 'type', direction: 'ASC' },
                    { by: 'name', direction: 'ASC' }
                ]
        * }
        * ```
        */
        assert(folderID !== undefined, "folderID is undefined, meaning that it wasn't passed into this function")
        assert(typeof folderID === 'string', "Typeof folderID is not string, actual type is ", typeof folderID)
        assert(typeof offset === 'number', "Offset is either undefined or not typeof number")
        this.files = await this.client.folders.getItems(folderID, {
            usemarker: 'false',
            fields: 'name',
            offset: offset,
        })
        return this.files
    }
    async getFile(fileID) {
        assert(fileID !== undefined, "fileID is undefined, meaning that it wasn't passed into this function")
        assert(typeof fileID === 'string', "Typeof fileID is not string, actual type is ", typeof fileID)
        const fileURL = await this.client.files.getDownloadURL(fileID)
        return fileURL
    }
    async getRandomFile(randomNumber) {
        const response = {
            fileID: "",
            fileName: "",
            url: "",
        }
        assert(randomNumber !== undefined, "Random number is undefined, meaning that it wasn't properly passed to the function.")
        assert(typeof randomNumber === "number", "typeof randomNumber is not number, and this function requires it to be a number.")
        assert(this.files !== undefined, "File are undefined - make sure to call listItemsInFolder() first and that there are files in the requested folder.")
        assert(this.files.entries.length > randomNumber, "Random number exceeds range of available files.")


        response.fileID = this.files?.entries[randomNumber]?.id
        response.fileName = this.files?.entries[randomNumber]?.name
        response.url = await this.getFile(response.fileID)
        return response
    }
    async uploadFile(filename, stream, options) {
        const request = await this.client.files.uploadFile(this.folderID, filename, stream, options)
        return request
    }
    async getAllFilesInFolder(folderID) {
        const entriesArray = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            try {
                const files = await this.listItemsInFolder(folderID, offset);
                entriesArray.push(...files.entries);

                offset += files.entries.length;
                hasMore = files.entries.length > 0 && entriesArray.length < files.total_count;
            } catch (error) {
                console.error('Error fetching files:', error);
                break;
            }
        }

        return entriesArray;
    }
}
class Picture {
    async convertHeicUrlToJpgBase64(url) {
        assert(url !== undefined, "url is undefined, meaning that it was most likely passed incorrectly into this function.")
        const request = await fetch(url)
        const inputBuffer = await request.arrayBuffer()
        const outputBuffer = await convert({
            buffer: new Uint8Array(inputBuffer),
            format: 'JPEG',
            quality: 1
        })

        // Convert the JPG buffer to base64
        const base64Jpg = outputBuffer.toString('base64');

        // Return the base64-encoded JPG
        return base64Jpg;
    }
    async convertPngToJpgBase64(url) {
        try {
            // Read the PNG image
            const image = await Jimp.read({
                url: url
            });

            // Convert the image to JPG format
            const jpgBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

            // Convert the JPG buffer to base64
            const base64Jpg = jpgBuffer.toString('base64');

            // Return the base64-encoded JPG
            return base64Jpg;
        } catch (error) {
            console.error('Error converting image:', error);
            throw error;
        }
    }
    async handleFileType(file) {
        // Written this way for intellisense
        assert(file !== undefined, "File is undefined, meaning that it wasn't passed correctly to this function.")

        switch (true) {
            case (file.fileName.endsWith(".heic")): {
                return await this.convertHeicUrlToJpgBase64(file.url)
            }
            case (file.fileName.endsWith(".png")): {
                return await this.convertPngToJpgBase64(file.url)
            }
            case (file.fileName.endsWith(".jpg")): {
                const image = Jimp.read({
                    url: file.url
                })
                const jpgBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

                // Convert the JPG buffer to base64
                const base64Jpg = jpgBuffer.toString('base64');

                // Return the base64-encoded JPG
                return `data:image/jpeg;base64,${base64Jpg}`;
            }
            case (file.fileName.endsWith(".jpeg")): {
                const image = Jimp.read({
                    url: file.url
                })
                const jpgBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

                // Convert the JPG buffer to base64
                const base64Jpg = jpgBuffer.toString('base64');

                // Return the base64-encoded JPG
                return `data:image/jpeg;base64,${base64Jpg}`;
            }
        }
    }
}

export default async (req) => {
    const { next_run } = await req.json()
    console.log("Received event! Next invocation at:", next_run)
    // export default async function handler() {

    const box = new Box()
    const picture = new Picture()

    const heicFiles = await box.getAllFilesInFolder(process.env.BOX_HEIC_FOLDER_ID)
    const convertedFiles = await box.getAllFilesInFolder(process.env.BOX_FOLDER_ID)

    /** Error handling for heicFiles response / handling for total_count = 0 */
    switch (true) {
        case (heicFiles === undefined): {
            const error = "items returned as undefined, which means there was a problem with the call"
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
    }

    const heicFilesArray = []
    for (let i = 0; i < heicFiles?.length; i++) {
        /** Struct for easy review */
        let itemStruct = {
            type: "string",
            id: "string",
            etag: "string",
            name: "string"
        }
        if (heicFiles[i]?.name?.includes(".")) {
            let trimmedName = heicFiles[i].name.split(".")[0]
            heicFilesArray.push({
                id: heicFiles[i].id,
                name: heicFiles[i].name,
                trimmedName: trimmedName,
                type: heicFiles[i].type
            })
        }
    }

    const convertedFilesArray = []
    if (convertedFiles.length !== 0) {
        for (let i = 0; i < convertedFiles?.length; i++) {
            /** Struct for easy review */
            let itemStruct = {
                type: "string",
                id: "string",
                etag: "string",
                name: "string"
            }
            if (convertedFiles[i]?.name?.includes(".")) {
                let trimmedName = convertedFiles[i].name.split(".")[0]
                convertedFilesArray.push({
                    id: convertedFiles[i].id,
                    name: convertedFiles[i].name,
                    trimmedName: trimmedName,
                    type: convertedFiles[i].type
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
        console.log(`Iteration ${i}`)
        let base64img
        let fileURL
        switch (true) {
            case (file?.name?.toLowerCase().endsWith(".heic")): {
                fileURL = await box.getFile(file.id)
                console.log(fileURL)
                assert(fileURL !== undefined, "FileURL is undefined")
                try {
                    base64img = await picture.convertHeicUrlToJpgBase64(fileURL)
                } catch (err) {
                    if (JSON.stringify(err).includes("input buffer is not a HEIC image")) {
                        base64img = await picture.convertPngToJpgBase64(fileURL)
                    } else {
                        continue
                    }
                }
                break;
            }
            case (file?.name?.toLowerCase().endsWith(".png")): {
                fileURL = await box.getFile(file.id)
                console.log(fileURL)
                assert(fileURL !== undefined, "FileURL is undefined")
                base64img = await picture.convertPngToJpgBase64(fileURL)
                break;
            }
            case (file?.name?.toLowerCase().endsWith(".jpg") || file?.name?.endsWith(".jpeg")): {
                fileURL = await box.getFile(file.id)
                console.log(fileURL)
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
// handler()