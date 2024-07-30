import convert from 'heic-convert'
import Jimp from 'jimp'
import assert from 'node:assert'

export default class Picture {
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