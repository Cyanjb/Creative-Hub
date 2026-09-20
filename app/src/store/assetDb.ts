/** V2 managed-media access. Never opens V1 IndexedDB or browser storage. */
const urls=new Map<string,string>();
export async function putBlob(id:string,blob:Blob,productionId?:string):Promise<void>{if(!productionId)throw Error('Production is required for managed media');const r=await fetch(`/api/v2/media/${encodeURIComponent(productionId)}/${encodeURIComponent(id)}`,{method:'POST',headers:{'Content-Type':blob.type||'image/png'},body:blob});const body=await r.json();if(!r.ok)throw Error(body.error||'Media preservation failed');urls.set(id,body.url);}
export async function getBlob(id:string):Promise<Blob|null>{const r=await fetch(`/api/v2/media/${encodeURIComponent(id)}`);if(!r.ok)return null;return r.blob();}
/** Removing an Asset never destroys the underlying managed file in this milestone. */
export async function deleteBlob(_id:string):Promise<void>{}
export function peekAssetUrl(id:string){return urls.get(id);}
export async function resolveAssetUrl(id:string):Promise<string|null>{return urls.get(id)||`/api/v2/media/${encodeURIComponent(id)}`;}
export function registerAssetUrl(id:string,url:string){urls.set(id,url);}
export function forgetAssetUrl(id:string){const url=urls.get(id);if(url?.startsWith('blob:'))URL.revokeObjectURL(url);urls.delete(id);}
export async function readImageSize(src:string):Promise<{width:number;height:number}>{return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>resolve({width:800,height:450});img.src=src;});}
