import greet from "js/init/greet";
import initEventBinding from "js/init/eventBinding";
import home from "js/init/home";
import initImage from "js/init/initImage";
import initCodeBlock from "js/init/initCodeBlock";
import enhanceOrgMode from './js/init/enhanceOrgMode';
import enhanceMarkdown from './js/init/enhanceMarkdown';
import runMisc from './js/init/runMisc';
import * as params from '@params';

if (params.params.backend && params.params.backend.deviceapiendpoint) {
    home(params.params.backend.deviceapiendpoint)
}
greet();
enhanceOrgMode();
initCodeBlock();
enhanceMarkdown();
initImage();
initEventBinding();
runMisc();