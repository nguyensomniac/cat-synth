const io = require('socket.io-client');
const T = require('timbre');
const _ = require('underscore');
const THREE = require('three');
const STLLoader = require('three-stl-loader')(THREE);

const socket = io();

let midiPlayer = T('midicps');

const osc = T('sin', {freq: midiPlayer, mul: 0.25}).play();
osc.isPaused = false;
osc.currentWave = 'sin';
document.body.classList.add(osc.currentWave);

const updateMidi = ({note, volume}) => {
  if (osc.isPaused) {
    osc.isPaused = false;
    osc.play();
  }
  if (midiPlayer.midi != note) {
    midiPlayer.midi = note;
  }
  osc.mul = volume;
}

const updateTimbre = ({timbre}) => {
  const waves = ["sin", "saw", "tri", "pulse", "fami"];
  const index = Math.floor(timbre / 128 * 5);
  if (osc.currentWave != waves[index]) {
    osc.currentWave = waves[index];
    osc.wave = waves[index];
    for (let i = 0; i < waves.length; i++) {
      document.body.classList.remove(waves[i]);
    }
    document.body.classList.add(osc.currentWave);
  }
}

const pauseOutput = () => {
  if (!osc.isPaused) {
    osc.pause();
    osc.isPaused = true;
  }
}

socket.on('midi', (m) => {
      const message = JSON.parse(m);
      switch (message.message[0] & 0xF0) {
        case 0x80:
          pauseOutput();
          break;
        case 0x90:
          const note = message.message[1];
          const volume = message.message[2] / 128 * 2;
          _.debounce(updateMidi({note, volume}, 100));
          break;
        case 0xB0:
          const timbre = message.message[2];
          _.debounce(updateTimbre({timbre}), 100);
          break;
        default:
          break;
      }
})

//set scene

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setClearColor( 0xffffff, 0);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

let catGroup;
window.cat = '';

var loader = new STLLoader();

const materials = {
  sin: new THREE.MeshPhongMaterial({
    color: 0xF75793,
    flatShading: true
  }),
  saw: new THREE.MeshPhongMaterial({
    color: 0xC786FF,
    flatShading: true
  }),
  tri: new THREE.MeshPhongMaterial({
    color: 0x7EF1E9,
    flatShading: true
  }),
  pulse: new THREE.MeshPhongMaterial({
    color: 0xF75793,
    flatShading: true
  }),
  fami: new THREE.MeshPhongMaterial({
    color: 0x617CFF,
    flatShading: true
  }),
}

loader.load('./calicat.stl', (geometry) => {
   var material = new THREE.MeshPhongMaterial({
     color: 0xF75793,
     flatShading: true
   })
   cat = new THREE.Mesh(geometry, material);
   cat.position.set(-20.00, 0, -20.00);
   cat.rotation.set(-90.00, 0, 0);
   catGroup = new THREE.Object3D();
   catGroup.add(cat);
   scene.add(catGroup);
})


let hemisphereLight = new THREE.HemisphereLight(0xB5D4B7,0x74909C, .9);
let shadowLight = new THREE.DirectionalLight(0xffffff, .9);
shadowLight.position.set(150, 350, 350);
shadowLight.castShadow = true;
shadowLight.shadow.camera.left = -400;
shadowLight.shadow.camera.right = 400;
shadowLight.shadow.camera.top = 400;
shadowLight.shadow.camera.bottom = -400;
shadowLight.shadow.camera.near = 1;
shadowLight.shadow.camera.far = 1000;
shadowLight.shadow.mapSize.width = 2048;
shadowLight.shadow.mapSize.height = 2048;

// to activate the lights, just add them to the scene
scene.add(hemisphereLight);
scene.add(shadowLight);

camera.position.z = 34.30;
camera.position.y = 20;
camera.lookAt( new THREE.Vector3(0, 20, 20) );

let catCounter = 0;
var animate = function () {
	requestAnimationFrame( animate );
  const volume = osc.mul;
  if (catGroup) {
    catGroup.position.y = (midiPlayer.midi * 3.5) - (60 + 6) * 3.5 + .25 * Math.sin(catCounter * Math.PI / 180);
    catCounter += 3;
    if (!osc.isPaused) {
      catCounter += 7;
    }
    catGroup.scale.set(volume, volume, volume);
    cat.material = materials[osc.currentWave];
  }
	renderer.render(scene, camera);
};

animate();
