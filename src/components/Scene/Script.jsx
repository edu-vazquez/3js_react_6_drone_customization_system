import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import * as dat from 'dat.gui';
import { gsap } from 'gsap';


//Global variables
let currentRef = null;

// GUI
const gui = new dat.GUI({ width: 600})

//Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x393939);
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100);
scene.add(camera);
camera.position.set(-7, 5, 10);
camera.lookAt(new THREE.Vector3());

const renderer = new THREE.WebGLRenderer();
renderer.antialias = true;
renderer.outpuEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setPixelRatio(2);
renderer.setSize(100, 100);

// IMPORTAR MODELOS
const droneParts = {
  motores: new THREE.Group(),
  helices: new THREE.Group(),
  base: new THREE.Group(),
  camaras: new THREE.Group(),
};

//OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// init GLTF LOADER
const loadingManager = new THREE.LoadingManager(() => {
  castShadow()
});
const gltfLoader = new GLTFLoader(loadingManager);

// CAST AND RECEIVE SHADOWS
const castShadow = () => {
  scene.traverse((child) => {
    if( child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.envMapIntensity = 0.38;
    }
  })
}

// PLANE BASE SHADOW
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  new THREE.ShadowMaterial({ opacity: 0.3 })
)
plane.rotation.x = -Math.PI * 0.5;
plane.position.y = -0.75
scene.add(plane);


//Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);

//Animate the scene
const clock = new THREE.Clock();
const animate = () => {
  const elapsedTime = clock.getElapsedTime();

  const movementFloat = Math.sin(elapsedTime) * 0.1;
  droneParts.base.position.y = movementFloat;
  droneParts.motores.position.y = movementFloat;
  droneParts.helices.position.y = movementFloat;
  droneParts.camaras.position.y = movementFloat;

  try {
    for (let i = 0; i < droneParts.helices.children.length; i++){
      droneParts.helices.children[i].rotation.y = elapsedTime * 5
    }
  } catch (error){}
  
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

//cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial()
);
//scene.add(cube);

// LIGHTS
const light1 = new THREE.DirectionalLight(0xfcfcfc, 4.3);
light1.position.set(0,6,1);
light1.castShadow = true;
light1.shadow.mapSize.set(2048, 2048);
light1.shadow.bias = -0.000131;
scene.add(light1);

const al = new THREE.AmbientLight(0x208080, 0.61);
scene.add(al);

const envMap = new THREE.CubeTextureLoader().load([
  './envMaps/px.png',
  './envMaps/nx.png',
  './envMaps/py.png',
  './envMaps/nx.png',
  './envMaps/pz.png',
  './envMaps/nz.png',
]);
scene.environment = envMap;

//Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current;
  resize();
  currentRef.appendChild(renderer.domElement);
};

//Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  gui.destroy();
  scene.traverse((object) => {
    // Limpiar geometrías
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Limpiar materiales
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    }

    // Limpiar texturas
    if (object.material && object.material.map) {
      object.material.map.dispose();
    }
  });
  currentRef.removeChild(renderer.domElement);
};

// LOAD GROUPS to the scene
export const loadGroups = () => {
  scene.add(droneParts.motores);
  scene.add(droneParts.camaras);
  scene.add(droneParts.helices);
  scene.add(droneParts.base);
};

// LOAD MODEL TO EACH GROUP
export const loadModels = (route, group) => {
  gltfLoader.load(route, (gltf) => {
    while (gltf.scene.children.length) {
      droneParts[group].add(gltf.scene.children[0]);
    }
  })
}

// remove old models
export const removeModels = (route, group) => {
  //get reference
  const oldModels = new THREE.Group();
  while(droneParts[group].children.length){
    oldModels.add(droneParts[group].children[0])
  }

  //remove childrens
  while(droneParts[group].children.length){
    droneParts[group].remove(droneParts[group].children[0]);
  }

  //dispose
  oldModels.traverse( child => {
    if (child instanceof THREE.Mesh ) {
      child.material.dispose();
      child.geometry.dispose();
    }
  })

  loadModels(route, group);
} 

// debugueo
/* const cubeAux =  new THREE.Mesh(
  new THREE.BoxGeometry(0.1,0.1,0.1),
  new THREE.MeshBasicMaterial({ color: 'red'})
)
scene.add(cubeAux) */

gui.add(cubeAux.position, 'x')
  .min(-10).max(10).step(0.001)
  .name('target x')
  .onChange( () => {
    orbitControls.target.x = cubeAux.position.x
  });

gui.add(cubeAux.position, 'y')
  .min(-10).max(10).step(0.001)
  .name('target y')
  .onChange( () => {
    orbitControls.target.y = cubeAux.position.y
  });

gui.add(cubeAux.position, 'z')
  .min(-10).max(10).step(0.001)
  .name('target z')
  .onChange( () => {
    orbitControls.target.z = cubeAux.position.z
  });

gui.add(camera.position, 'x')
  .min(-10).max(10).step(0.001)
  .name('camera x')
gui.add(camera.position, 'y')
  .min(-10).max(10).step(0.001)
  .name('camera y')
gui.add(camera.position, 'z')
  .min(-10).max(10).step(0.001)
  .name('camera z')
gui.add(camera, 'zoom')
.min(-5).max(5).step(0.001)
.name('camera zoom')
.onChange(() => {
  camera.updateProjectionMatrix();
})

// animations
const timeline = new gsap.timeline({
  defaults: { duration: 1}
})
export const gsapAnimation = (targetPos, camPos, zoom) => {
  timeline
    .to(orbitControls.target, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z
    })
    .to(camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
    }, '-=1.0')
    .to(camera, {
      zoom: zoom,
      onUpdate: () => {
        camera.updateProjectionMatrix();
      }
    }, '-=1.0')
}