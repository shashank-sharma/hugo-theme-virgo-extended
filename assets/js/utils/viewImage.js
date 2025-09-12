import $ from '../libs/jquery.min';

export default function viewImage(e) {

	// 首页图片不执行任何动作
	if (location.pathname === '/') return;
	// console.log(e)
	let curImgSrc = e.target.attributes.src.value;
	curImgSrc = encodeURI(curImgSrc)
	console.log(curImgSrc)
	
	// Check if the clicked image has the dark-invert class
	const hasDarkInvertClass = e.target.classList.contains('dark-invert');
	const darkInvertClass = hasDarkInvertClass ? 'class="dark-invert"' : '';

	// backdrop-filter: blur(5px);
	document.body.style = "overflow: hidden;"
	// onclick="document.body.removeChild(document.getElementById('mask')); document.body.style=''"
	// <div style="width: 24px;" onclick="document.getElementById('img').width = 1000"><svg t="1667356164779" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17343" width="22" height="22"><path d="M111.793744 425.788348c6.856001 0.716299 13.098031 3.172179 18.419107 6.753673L329.548516 514.81403c20.772659 8.595583 30.698511 32.335765 22.102928 53.108424-7.981613 19.340062-29.061257 29.265914-48.605976 23.637854l-4.502448-1.534926-152.878585-62.931947c5.218747 123.203358 72.346158 238.015789 182.860797 301.868692 175.18617 101.10043 399.182972 41.136005 500.283402-134.050165 11.256121-19.44239 36.121915-26.093734 55.564305-14.939942 19.44239 11.256121 26.093734 36.121915 14.939942 55.564305-123.510343 214.173279-397.238733 287.54272-611.412012 163.930049C132.361747 809.622065 47.122214 637.096432 66.769262 461.705606c2.558209-22.409913 22.716898-38.475467 45.024482-35.917258z m623.793745-301.664035c155.641451 89.844309 240.880983 262.472269 221.131608 437.965424-2.558209 22.307585-22.61457 38.373139-45.024483 35.917258-7.060658-0.818627-13.507345-3.376836-18.930749-7.162986l-198.824023-81.965024c-20.772659-8.595583-30.698511-32.335765-22.102928-53.108424 7.981613-19.340062 29.061257-29.265914 48.605976-23.637854l4.502448 1.534926 152.878585 62.931947c-5.218747-123.203358-72.346158-238.015789-182.860797-301.868692-175.18617 101.10043-399.182972 41.136005-500.283402 134.050165-11.256121 19.44239-36.121915 26.093734-55.564305 14.939942 19.44239 11.256121 26.093734 36.121915 14.939942 55.564305C247.68582 73.881083 521.41421 0.511642 735.587489 124.124313z" p-id="17344" fill="#1296db"></path></svg></div>	

	$('body').prepend(
		`
		<div 
			id="mask" 
			style="
				position: fixed; 
				background: rgba(255, 255, 255, .96); 
				backdrop-filter: blur(5px);
				left: 0; top: 0; 
				width: 100%; height: 100%; 
				overflow: hidden; 
				z-index: 2000; 
				"
			>
			<button 
				id="img-close"
				aria-label="Close preview"
				style="
					position: absolute; 
					top: 12px; right: 16px;
					width: 36px; height: 36px;
					border: 0; border-radius: 18px;
					background: rgba(0,0,0,0.55);
					color: #fff; cursor: pointer;
					display: flex; align-items: center; justify-content: center;
					z-index: 1;
				"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
			</button>
			<div 
				id="wrapper_img"
				style="
					width:100%; 
					height: 100%;
					margin: 0; 
					overflow: hidden;
					display: flex;
					align-items: center; justify-content: center;
				"
				>
				<img 
					id="img"
					src=${curImgSrc} 
					${darkInvertClass}
					style="
						max-width: 90vw;
						max-height: 85vh;
						display: block; 
						box-sizing: border-box; 
						margin: 0; 
						padding: 0; 
						transition: transform 200ms ease;
						transform-origin: center center;
						cursor: zoom-in;
						user-select: none;
						-webkit-user-drag: none;
					" 
				/>
			</div>
		</div>
		`
	)

	// Interactions
	const mask = document.getElementById('mask');
	const img = document.getElementById('img');
	const closeBtn = document.getElementById('img-close');

	function closePreview() {
		if (mask && mask.parentNode) mask.parentNode.removeChild(mask);
		document.body.style = '';
	}

	// Toggle zoom on click
	let zoomed = false;
	img.addEventListener('click', () => {
		zoomed = !zoomed;
		if (zoomed) {
			img.style.transform = 'scale(1.4)';
			img.style.cursor = 'zoom-out';
		} else {
			img.style.transform = 'scale(1)';
			img.style.cursor = 'zoom-in';
		}
	});

	// Close button
	closeBtn.addEventListener('click', (ev) => {
		ev.preventDefault();
		closePreview();
	});

	// Click outside image closes
	mask.addEventListener('click', (ev) => {
		if (ev.target === mask) closePreview();
	});

	// ESC to close
	document.addEventListener('keydown', function onKey(ev) {
		if (ev.key === 'Escape') {
			document.removeEventListener('keydown', onKey);
			closePreview();
		}
	});
}