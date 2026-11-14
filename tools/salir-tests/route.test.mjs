import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const c=vm.createContext({Date,Math,Number,Array,String,Intl,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync('salir/route.js','utf8'),c);
test('cardinal directions and distance agree with route geometry',()=>{
assert.equal(vm.runInContext('routeBearing({lat:0,lon:0},{lat:1,lon:0})',c),0);
assert.equal(vm.runInContext('routeBearing({lat:0,lon:0},{lat:0,lon:1})',c),90);
assert.equal(vm.runInContext('routeBearing({lat:1,lon:0},{lat:0,lon:0})',c),180);
assert.ok(Math.abs(vm.runInContext('routeDistance({lat:0,lon:0},{lat:0,lon:1})',c)-111.195)<.01);
});
test('eight samples cover a loop in travel order including both endpoints',()=>{
const r=vm.runInContext('sampleBikeRoute({km:20,points:[{lat:40,lon:-3,km:0},{lat:40.1,lon:-3,km:10},{lat:40,lon:-3,km:20}]})',c);
assert.equal(r.length,8);assert.equal(r[0].km,0);assert.equal(r[7].km,20);assert.equal(r[0].lat,r[7].lat);
assert.ok(r.slice(1).every((p,i)=>p.km>r[i].km));assert.equal(r[1].bearing,0);assert.equal(r[6].bearing,180);
});
test('date-line interpolation takes the short arc',()=>{
const r=vm.runInContext('sampleBikeRoute({km:20,points:[{lat:0,lon:179.9,km:0},{lat:0,lon:-179.9,km:20}]})',c);
assert.ok(r.every(p=>Math.abs(p.lon)>179));
});
