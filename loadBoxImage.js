async function loadBoxImage() {
    const response = await fetch('/')
    return console.log(await response.text())

    try {
        const response = await fetch('/.netlify/functions/getBoxImage');
        const data = await response.json();
        const pictureURL = data.body
        console.log(pictureURL)

        if (pictureURL) {
            document.getElementById('banko-picture').src = pictureURL;
        } else {
            console.error('Failed to load image URL');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call this function when you want to load the image
loadBoxImage();