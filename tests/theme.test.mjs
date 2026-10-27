import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme,changeTheme} from '../dist/theme.mjs';
test('saved explicit preference overrides OS and invalid preference follows OS',()=>{
 assert.equal(resolveTheme({getItem:()=> 'light'},true),'light');
 assert.equal(resolveTheme({getItem:()=> 'dark'},false),'dark');
 assert.equal(resolveTheme({getItem:()=> 'invalid'},true),'dark');
 assert.equal(resolveTheme({getItem:()=> {throw Error();}},false),'light');
});
test('toggle saves preference and still toggles if storage blocked',()=>{
 let saved;assert.equal(changeTheme('light',{setItem:(key,value)=>saved=value}),'dark');assert.equal(saved,'dark');
 assert.equal(changeTheme('dark',{setItem:()=>{throw Error();}}),'light');
});
