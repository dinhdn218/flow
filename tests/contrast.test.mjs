import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
function tokens(selector){const block=css.match(selector)[1];return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})/g)].map(m=>[m[1],m[2]]));}
function luminance(hex){let value=hex.slice(1);if(value.length===3)value=value.split('').map(c=>c+c).join('');const v=value.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function ratio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const light=tokens(/:root\{([^}]+)\}/);const dark={...light,...tokens(/\[data-theme=dark\]\{([^}]+)\}/)};
for(const [name,theme] of [['light',light],['dark',dark]])test(name+' normal text and colored labels meet 4.5:1 contrast',()=>{
 for(const [front,back] of [['ink','surface'],['secondary','surface'],['muted','surface'],['muted','bg'],['on-accent','accent'],...['violet','blue','green','orange','pink'].map(c=>[c,c+'-bg'])])assert.ok(ratio(theme[front],theme[back])>=4.5,`${front} on ${back}: ${ratio(theme[front],theme[back]).toFixed(2)}`);
});
