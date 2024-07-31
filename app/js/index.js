let currentImage = '../assets/IMG_3816.jpg';
let isFirstLoad = true;

async function loadBoxImage() {
    const imgElement = document.getElementById('banko-picture');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (isFirstLoad) {
        loadingIndicator.style.display = 'block';
        imgElement.style.opacity = '0';
    }

    try {
        const response = await fetch('/api/getBoxImage');
        const data = await response.json();

        const newImage = new Image();
        newImage.src = data.img;

        newImage.onload = () => {
            loadingIndicator.style.display = 'none';
            imgElement.src = newImage.src;
            imgElement.style.display = 'block';

            // Remove the old class and re-add it to trigger the animation
            imgElement.classList.remove('loaded');
            void imgElement.offsetWidth; // Trigger reflow
            imgElement.classList.add('loaded');

            currentImage = data.img;
            isFirstLoad = false;
        };

        newImage.onerror = () => {
            console.error('Error loading image:', data.img);
            loadingIndicator.style.display = 'none';
            imgElement.src = currentImage;
            imgElement.style.display = 'block';
            imgElement.classList.add('loaded');
        };

    } catch (error) {
        console.error('Error fetching image:', error);
        loadingIndicator.style.display = 'none';
        imgElement.src = currentImage;
        imgElement.style.display = 'block';
        imgElement.classList.add('loaded');
    }
}

function startImageCycle() {
    loadBoxImage();
    setInterval(loadBoxImage, 10000);
}

startImageCycle();