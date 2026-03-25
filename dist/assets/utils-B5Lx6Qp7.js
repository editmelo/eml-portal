import{r as i}from"./index-ze2urEtO.js";/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),s=(...e)=>e.filter((r,t,n)=>!!r&&n.indexOf(r)===t).join(" ");/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var y={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=i.forwardRef(({color:e="currentColor",size:r=24,strokeWidth:t=2,absoluteStrokeWidth:n,className:o="",children:a,iconNode:u,...m},l)=>i.createElement("svg",{ref:l,...y,width:r,height:r,stroke:e,strokeWidth:n?Number(t)*24/Number(r):t,className:s("lucide",o),...m},[...u.map(([f,g])=>i.createElement(f,g)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=(e,r)=>{const t=i.forwardRef(({className:n,...o},a)=>i.createElement(w,{ref:a,iconNode:r,className:s(`lucide-${p(e)}`,n),...o}));return t.displayName=`${e}`,t};function c(e){var r,t,n="";if(typeof e=="string"||typeof e=="number")n+=e;else if(typeof e=="object")if(Array.isArray(e)){var o=e.length;for(r=0;r<o;r++)e[r]&&(t=c(e[r]))&&(n&&(n+=" "),n+=t)}else for(t in e)e[t]&&(n&&(n+=" "),n+=t);return n}function h(){for(var e,r,t=0,n="",o=arguments.length;t<o;t++)(e=arguments[t])&&(r=c(e))&&(n&&(n+=" "),n+=r);return n}function C(...e){return h(e)}function D(e){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}function b(e){return e?new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}function k(e=""){return e.split(" ").map(r=>r[0]).slice(0,2).join("").toUpperCase()}function L(){const e=new Date;if(parseInt(e.toLocaleString("en-US",{timeZone:"America/New_York",hour:"numeric",hour12:!1}),10)<1){const t=new Date(e);return t.setDate(t.getDate()-1),t.toLocaleString("en-CA",{timeZone:"America/New_York"}).split(",")[0]}return e.toLocaleString("en-CA",{timeZone:"America/New_York"}).split(",")[0]}function S(e){let r=2166136261;for(let t=0;t<e.length;t++)r^=e.charCodeAt(t),r=Math.imul(r,16777619);return(r>>>0)/4294967295}export{C as a,b,A as c,D as f,k as g,L as q,S as s};
