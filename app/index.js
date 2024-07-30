async function run() {
    const Box = (await import("./js/box.js")).default
    const Picture = (await import("./js/picture.mjs")).default

    const box = new Box()
    const picture = new Picture()
    const items = await box.listItemsInFolder(process.env.BOX_FOLDER_ID)
    /** Error handling for items response */
    switch (true) {
        case (items === undefined): {
            const error = "items returned as undefined, which means there was a problem with the call"
            console.error(error)
            return error
        }
        case (items.total_count === undefined): {
            const error = "items.total_count is equal to undefined, meaning that there's something wrong with the payload"
            console.error(error)
            return error
        }
        case (items?.total_count === 0): {
            const error = "Total count of files is equal to 0, which should not be the case."
            console.error(error)
            return error
        }
        case (items?.entries === undefined): {
            const error = "Entries are undefined, meaning there's a problem with the payload"
            console.error(error)
            return error
        }
    }

    const min = 0
    const max = items?.total_count
    const randomNumber = Math.floor(Math.random() * (max - min)) + min
    const fileURL = await box.getRandomFile(randomNumber)
    const imgBuffer = await picture.convertHeicUrlToJpgBase64(fileURL)


    const imageElement = document.getElementById('banko-picture')
    imageElement.src = imgBuffer

}
run()