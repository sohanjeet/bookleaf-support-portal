// ScrollTrigger is registered here and only imported by pages that use it
// (currently the Knowledge Base), keeping the plugin out of other code paths.
import { gsap } from './gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { ScrollTrigger };
