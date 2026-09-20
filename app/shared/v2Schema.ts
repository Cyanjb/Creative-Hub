import { z } from 'zod';
export const id=z.string().regex(/^[A-Za-z0-9_-]+$/).max(160);
const str=z.string(),num=z.number().finite(),tags=z.array(str),ids=z.array(id);
const timestamps={createdAt:num,updatedAt:num},owned={id,projectId:id};
export const promptSchema=z.object({id,label:str,text:str,target:z.enum(['image','video','text','audio'])}).strict();
export const contentSchema=z.object({title:str,subtitle:str,scene:str,shot:str,imageAssetId:id.nullable(),prompts:z.array(promptSchema),notes:str,description:str,audio:str,video:str,characterIds:ids,worldIds:ids}).strict();
export const layoutSchema=z.object({id,x:num,y:num,w:num.positive(),h:num.positive(),rotation:num,z:num,tags});
export const presentationSchema=layoutSchema.extend({iconOnly:z.boolean(),icon:str,collapsed:z.object({prompts:z.boolean(),notes:z.boolean(),meta:z.boolean()}).strict()});
export const frameSchema=presentationSchema.merge(contentSchema).extend({kind:z.literal('frame')}).strict();
export const placementSchema=presentationSchema.extend({kind:z.literal('placement'),shotId:id}).strict();
export const imageSchema=layoutSchema.extend({kind:z.literal('image'),assetId:id.nullable(),src:str.nullable(),caption:str}).strict();
export const textSchema=layoutSchema.extend({kind:z.literal('text'),text:str,fontSize:num.positive(),color:str,bold:z.boolean()}).strict();
export const nodeSchema=z.discriminatedUnion('kind',[frameSchema,placementSchema,imageSchema,textSchema]);
export const wireSchema=z.object({id,fromId:id,toId:id,type:z.enum(['image','video','text']),label:str}).strict();
export const productionSchema=z.object({id,name:str,description:str,color:str,...timestamps,shotOrder:ids}).strict();
export const shotSchema=contentSchema.extend({id,productionId:id,...timestamps}).strict();
export const boardSchema=z.object({...owned,name:str,kind:z.enum(['whiteboard','storyboard','pipeline']),viewMode:z.enum(['whiteboard','storyboard']),camera:z.object({x:num,y:num,zoom:num.positive()}).strict(),showGrid:z.boolean(),snapToGrid:z.boolean(),nodes:z.array(nodeSchema),wires:z.array(wireSchema),...timestamps}).strict();
export const characterSchema=z.object({...owned,name:str,role:str,logline:str,age:str,appearance:str,wardrobe:str,personality:str,backstory:str,voice:str,arc:str,signature:str,portraitAssetId:id.nullable(),sheetAssetIds:ids,tags,...timestamps}).strict();
export const worldSchema=z.object({...owned,name:str,category:str,summary:str,description:str,visualKeys:str,rules:str,assetIds:ids,tags,...timestamps}).strict();
export const sceneSchema=z.object({id,heading:str,action:str,dialogue:str,notes:str}).strict();
export const scriptSchema=z.object({...owned,title:str,logline:str,genre:str,tone:str,treatment:str,scenes:z.array(sceneSchema),tags,...timestamps}).strict();
export const assetSchema=z.object({...owned,name:str,url:str.nullable(),mime:str,width:num.nonnegative(),height:num.nonnegative(),kind:z.enum(['upload','url','generated']),category:str,tags,createdAt:num}).strict();
export const resourceSchema=z.object({...owned,title:str,body:str,tags,createdAt:num}).strict();
export const linkSchema=z.object({...owned,title:str,url:str,tags,createdAt:num}).strict();
export const noteSchema=resourceSchema.extend({updatedAt:num}).strict();
export const templateSchema=z.object({id,name:str,description:str,nodes:z.array(z.discriminatedUnion('kind',[frameSchema,imageSchema,textSchema])),wires:z.array(wireSchema),createdAt:num}).strict();
export const stateShape=z.object({schemaVersion:z.literal(2),projects:z.array(productionSchema),shots:z.array(shotSchema),boards:z.array(boardSchema),characters:z.array(characterSchema),worlds:z.array(worldSchema),scripts:z.array(scriptSchema),assets:z.array(assetSchema),resources:z.array(resourceSchema),links:z.array(linkSchema),notes:z.array(noteSchema),workflowTemplates:z.array(templateSchema)}).strict();
export type HubState=z.infer<typeof stateShape>;
export type Shot=z.infer<typeof shotSchema>;
export type FrameNode=z.infer<typeof frameSchema>&{shotId?:string};
export type Board=z.infer<typeof boardSchema>;
export type BoardNode=z.infer<typeof nodeSchema>;
export type RenderBoard=Omit<Board,'nodes'>&{nodes:(FrameNode|z.infer<typeof imageSchema>|z.infer<typeof textSchema>)[]};
export const stateSchema=stateShape.superRefine((s,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:z.ZodIssueCode.custom,message});
 const unique=(xs:{id:string}[],label:string)=>{if(new Set(xs.map(x=>x.id)).size!==xs.length)fail('Duplicate '+label+' IDs');};
 for(const [key,value] of Object.entries(s))if(Array.isArray(value))unique(value,key);
 const productions=new Set(s.projects.map(p=>p.id));
 for(const xs of [s.boards,s.characters,s.worlds,s.scripts,s.assets,s.resources,s.links,s.notes])for(const x of xs)if(!productions.has(x.projectId))fail('Missing Production '+x.projectId);
 const shots=new Map(s.shots.map(x=>[x.id,x]));
 for(const shot of s.shots)if(!productions.has(shot.productionId))fail('Missing Shot owner');
 for(const p of s.projects){const expected=s.shots.filter(x=>x.productionId===p.id);if(new Set(p.shotOrder).size!==p.shotOrder.length||expected.length!==p.shotOrder.length||p.shotOrder.some(x=>shots.get(x)?.productionId!==p.id))fail('Editorial order must contain every owned Shot exactly once');}
 for(const b of s.boards){unique(b.nodes,'node');unique(b.wires,'wire');const nodes=new Set(b.nodes.map(n=>n.id));for(const n of b.nodes)if(n.kind==='placement'&&shots.get(n.shotId)?.productionId!==b.projectId)fail('Missing or cross-Production Shot placement');for(const w of b.wires)if(!nodes.has(w.fromId)||!nodes.has(w.toId))fail('Dangling wire');}
 const checkContent=(c:z.infer<typeof contentSchema>,pid:string)=>{if(c.characterIds.some(x=>!s.characters.some(v=>v.id===x&&v.projectId===pid)))fail('Invalid Character link');if(c.worldIds.some(x=>!s.worlds.some(v=>v.id===x&&v.projectId===pid)))fail('Invalid World link');if(c.imageAssetId&&!s.assets.some(a=>a.id===c.imageAssetId&&a.projectId===pid))fail('Invalid image asset');};
 for(const x of s.shots)checkContent(x,x.productionId);
 for(const b of s.boards)for(const n of b.nodes){if(n.kind==='frame')checkContent(n,b.projectId);if(n.kind==='image'&&n.assetId&&!s.assets.some(a=>a.id===n.assetId&&a.projectId===b.projectId))fail('Invalid free image asset');}
 for(const t of s.workflowTemplates){unique(t.nodes,'template node');const ns=new Set(t.nodes.map(n=>n.id));for(const w of t.wires)if(!ns.has(w.fromId)||!ns.has(w.toId))fail('Dangling template wire');}
});
export function emptyState():HubState{return {schemaVersion:2,projects:[],shots:[],boards:[],characters:[],worlds:[],scripts:[],assets:[],resources:[],links:[],notes:[],workflowTemplates:[]};}
export const saveSchema=z.object({revision:z.number().int().nonnegative(),state:stateSchema}).strict();
export const snapshotSchema=saveSchema;
