export default function initHeaderImageCaption() {
    try {
        const headerImages = document.querySelectorAll('img.blog-header-image');
        headerImages.forEach((img) => {
            // Avoid processing the same image twice
            if (img.closest('.blog-header-figure')) return;

            const altText = img.getAttribute('alt') || '';
            if (!altText.trim()) return; // no caption if no alt text

            const figure = document.createElement('figure');
            figure.className = 'blog-header-figure';

            const caption = document.createElement('figcaption');
            caption.className = 'blog-header-caption';
            caption.textContent = altText;

            // Insert figure in the DOM in place of the image
            const parent = img.parentNode;
            if (!parent) return;

            parent.insertBefore(figure, img);
            figure.appendChild(img);
            figure.appendChild(caption);
        });
    } catch (err) {
        // Fail silently to avoid breaking the page
        // console.error('initHeaderImageCaption error:', err);
    }
}
