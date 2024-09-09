import greet from "js/init/greet";
import initEventBinding from "js/init/eventBinding";
import home from "js/init/home";
import homeVideo from "js/init/homeVideo";
import initImage from "js/init/initImage";
import initCodeBlock from "js/init/initCodeBlock";
import enhanceOrgMode from './js/init/enhanceOrgMode';
import enhanceMarkdown from './js/init/enhanceMarkdown';
import runMisc from './js/init/runMisc';
import * as params from '@params';

function isHomePage() {
    return window.location.pathname === '/' || window.location.pathname === '/index.html';
}

if (params.params.backend && params.params.backend.deviceapiendpoint && isHomePage()) {
    console.log(params)
    home(params.params.backend.deviceapiendpoint)
}

if (params.params.video.src && isHomePage) {
    console.log("Rendering video");
    homeVideo(params.params.video.src, "home-header-vector-body")
}

greet();
enhanceOrgMode();
initCodeBlock();
enhanceMarkdown();
initImage();
initEventBinding();
runMisc();