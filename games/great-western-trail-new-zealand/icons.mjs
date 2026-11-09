// Original, consistent line icons. No external icon font or image assets.
const paths={
 sheep:'<path d="M7 8c-3-3-6 1-3 3-3 3 0 6 3 4 1 3 5 3 6 0 3 1 5-2 3-4 1-3-2-5-4-3-1-2-4-2-5 0Z"/><path d="m16 9 4 1 1 5-4 1-1-4M7 17v3m6-3v3"/>',
 scissors:'<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.5 8.5 12 12m-12-5 12-12M11 12l3-3"/>',
 hammer:'<path d="m4 5 6-3 7 7-4 4-3-3-7 10-3-3 9-8Z"/><path d="m14 5 3-3 5 5-3 3"/>',
 ship:'<path d="M12 2v14M12 3l8 11h-8M9 5 3 14h6M2 17h20l-4 5H6Z"/>',
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 4 16 4 16 0V6M4 11v6c0 4 16 4 16 0v-6"/>',
 gold:'<path d="m6 7-4 13h20L18 7ZM6 7h12M4 15h16M9 3h6"/>',
 exchange:'<path d="M3 7h17l-4-4M21 17H4l4 4M20 7l-4 4M4 17l4-4"/>',
 pioneer:'<path d="M5 22V3h14l-3 4 3 4H5M2 22h6"/>',
 certificate:'<path d="M5 2h14v14l-7 6-7-6Z"/><path d="m8 10 3 3 5-6"/>',
 wool:'<circle cx="12" cy="12" r="9"/><path d="M5 6c8 1 11 5 13 12M3 11c7 0 11 4 12 9M8 4c1 7 5 11 12 12M5 18c2-5 7-9 13-12"/>',
 map:'<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3ZM8 2v17M16 5v17"/>',
 hand:'<rect x="3" y="5" width="12" height="16" rx="2"/><path d="m8 5 2-3 11 3-3 15-3-1M7 10h4M7 14h4"/>',
 market:'<path d="M3 9h18l-2-6H5ZM4 10v11h16V10M9 21v-7h6v7M3 9c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0"/>',
 barn:'<path d="m2 9 10-7 10 7M4 8v14h16V8M8 22V12h8v10M8 12l8 10M16 12 8 22"/>',
 action:'<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
 star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
 rock:'<path d="m2 19 4-10 6-6 7 6 3 10ZM6 9l7 3-1-9M13 12l-3 7"/>',
 flood:'<path d="M12 2c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12ZM8 15c0 2 2 3 4 3"/>',
};
export const WORKER_ICONS=['sheep','hammer','ship','scissors'];
export const RESOURCE_ICONS={money:'coins',gold:'gold',exchange:'exchange',pioneer:'pioneer',certificate:'certificate',wool:'wool'};
export function iconDrawing(name){return paths[name]||paths.star;}
export function icon(name,cls=''){return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconDrawing(name)}</svg>`;}
export function svgIcon(name,x,y,size,color){return `<g transform="translate(${x} ${y}) scale(${size/24})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconDrawing(name)}</g>`;}
