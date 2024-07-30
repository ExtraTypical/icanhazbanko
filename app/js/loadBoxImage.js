async function loadBoxImage() {
    try {
        const response = await fetch('/.netlify/functions/getBoxImage');
        const data = await response.json();

        if (data.imageUrl) {
            document.getElementById('banko-picture').src = data.imageUrl;
        } else {
            console.error('Failed to load image URL');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call this function when you want to load the image
loadBoxImage();