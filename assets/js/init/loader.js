export function initLoader() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return null;
    if (loadingScreen.parentNode !== document.body) {
        document.body.appendChild(loadingScreen);
    }

    const tilesContainer = loadingScreen.querySelector('.loading-tiles');
    if (!tilesContainer) return { el: loadingScreen, hide: () => {} };

    function buildTiles() {
        tilesContainer.innerHTML = '';
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const baseTile = 56;
        const cols = Math.max(8, Math.round(vw / baseTile));
        const rows = Math.max(10, Math.round(vh / baseTile));
        tilesContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        tilesContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const centerCol = (cols - 1) / 2;
        const centerRow = (rows - 1) / 2;
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                const dx = c - centerCol;
                const dy = r - centerRow;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const jitter = Math.random() * 45;
                const delay = Math.min(580, Math.round(dist * 36 + jitter));
                tile.style.setProperty('--delay', `${delay}ms`);
                tilesContainer.appendChild(tile);
            }
        }
    }

    buildTiles();
    window.addEventListener('resize', buildTiles, { passive: true });
    return {
        el: loadingScreen,
        hide: () => {
            loadingScreen.classList.add('cube-fade');
            const cube = loadingScreen.querySelector('.minecraft-loader');
            if (cube && cube.parentNode) cube.parentNode.removeChild(cube);
            requestAnimationFrame(() => loadingScreen.classList.add('closing'));
            const tiles = loadingScreen.querySelectorAll('.tile');
            let maxDelay = 0;
            tiles.forEach(t => {
                const d = parseInt(getComputedStyle(t).getPropertyValue('--delay')) || 0;
                if (d > maxDelay) maxDelay = d;
            });
            const total = maxDelay + 620 + 180;
            setTimeout(() => { loadingScreen.remove(); }, total);
        }
    };
}


