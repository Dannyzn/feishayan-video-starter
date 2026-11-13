import * as THREE from '/three.module.js';

const timing = await (await fetch('/timeline.json')).json();
const {width,height,duration,spread,overflow} = timing;
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(width,height,false);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8efe7');
const aspect = width / height;
const camera = new THREE.OrthographicCamera(-9.4,9.4,9.4/aspect,-9.4/aspect,.1,100);
camera.position.set(8,18,12);
camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x617f70,2.7));
const sun = new THREE.DirectionalLight(0xffefce,2.2);
sun.position.set(-7,10,5);
scene.add(sun);

function box(x,y,z,w,h,d,color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color}));
  mesh.position.set(x,y,z);
  scene.add(mesh);
  return mesh;
}
box(0,-.6,0,14,1,9,0x80725d);
box(-6.5,.18,0,1, .56,9,0x7d916e);
box(6.5,.18,0,1,.56,9,0x7d916e);
box(-1,-.03,0,5,.16,8.4,0xcbb792);
box(1.65,.07,0,.35,.34,8.4,0x9d9279);
box(3.75,-.02,0,4,.1,8.4,0x9c967d);
box(-4.75,.04,0,2.5,.18,8.4,0x3e8c85);
box(4.45,.04,0,3.1,.18,8.4,0x4b9890);

const wash = box(0,.082,0,1,.052,8.35,0x64aba0);
const sheet = box(0,.24,0,1,.05,8.34,0x80c6b9);
const bankSlope = box(0,.23,0,1,.045,8.34,0x7bc0b2);
const ripples = [];
for (let i=0;i<36;i++) {
  const line = box(0,0,0,.23 + (i%4)*.045,.009,.038,0xc3eadb);
  ripples.push(line);
}

function setSpan(mesh,start,end) {
  mesh.visible = end > start;
  mesh.scale.x = Math.max(.001,end-start);
  mesh.position.x = (start+end)/2;
}

window.renderFrame = (t) => {
  const a = THREE.MathUtils.smoothstep(t,spread.start,spread.end);
  const b = THREE.MathUtils.smoothstep(t,overflow.start,overflow.end);
  const wetEdge = THREE.MathUtils.lerp(-3.5,1.47,a);
  const crestEdge = 1.47 + .36 * Math.min(1,b*3);
  const slopeEdge = 1.83 + 1.22 * Math.max(0,(b-1/3)*1.5);
  setSpan(wash,-3.5,wetEdge);
  setSpan(sheet,1.47,crestEdge);
  setSpan(bankSlope,1.83,slopeEdge);
  bankSlope.rotation.z = -.095;
  bankSlope.position.y = .24 - (slopeEdge-1.83)*.0475;
  for (const [i,line] of ripples.entries()) {
    const x = -5.8 + ((i*.318 + t*.68) % 11.6);
    const inPool = x < wetEdge || x > 3.05;
    const onCrest = x > 1.47 && x < crestEdge;
    const onSlope = x > 1.83 && x < slopeEdge;
    line.visible = inPool || onCrest || onSlope;
    line.position.set(x,onCrest ? .271 : onSlope ? .269-(x-1.83)*.095 : .138,-3.9+(i*.71)%7.8);
  }
  renderer.render(scene,camera);
};
window.renderFrame(0);

if (!new URLSearchParams(location.search).has('export')) {
  const seek = document.querySelector('#seek');
  const toggle = document.querySelector('#toggle');
  const time = document.querySelector('#time');
  seek.max = duration;
  let playing = true;
  let t = 0;
  let last = performance.now();
  toggle.onclick = () => { playing = !playing; toggle.textContent = playing ? '暂停' : '播放'; };
  seek.oninput = () => {t = Number(seek.value);};
  function loop(now) {
    if (playing) t = (t + (now-last)/1000) % duration;
    last = now;
    seek.value = t;
    time.value = t.toFixed(2) + ' s';
    window.renderFrame(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
} else document.querySelector('nav').hidden = true;
