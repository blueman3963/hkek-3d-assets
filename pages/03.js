import styles from '../styles/Home.module.scss'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEffect, useRef } from 'react'
import * as softShadow from '../shaders/softshadow'
import cx from 'classnames'

export default function Home() {

  const wrapper = useRef()
  const videoDom = useRef()

  useEffect(() => {

    // overwrite shadowmap code
    softShadow.softShadows({
      frustum: 3.75,
      size: 0.008,
      near: 9.5,
      samples: 30,
      rings: 11
    })

    videoDom.current.play()
      
    let scene,
        camera,
        renderer,
        width,
        height,
        controls,
        mixer,
        loader = new GLTFLoader().setPath( 'models/' )

    let cubeCamera, cubeRenderTarget

    const init = async () => {

      //init three
      renderer = new THREE.WebGLRenderer( { antialias: true } )
      renderer.shadowMap.enabled = true
      wrapper.current.appendChild( renderer.domElement )

      camera = new THREE.PerspectiveCamera( 30, 0, 0.1, 1000 )
			camera.position.set( 0, 0, 48 )

      scene = new THREE.Scene()

      window.addEventListener('resize', onResize)
      onResize()

      controls = new OrbitControls( camera, renderer.domElement )

      //light setting
      const ambLit = new THREE.AmbientLight( 0x999999 ); // soft white light
      scene.add( ambLit )

      const dirLit = new THREE.DirectionalLight( 0x888888, 1 )
      dirLit.position.set( 0, 12, 12 )
      dirLit.castShadow = true
      dirLit.shadow.mapSize.width = 2048
      dirLit.shadow.mapSize.height = 2048
      const d =40
      dirLit.shadow.camera.left = -d
      dirLit.shadow.camera.right = d
      dirLit.shadow.camera.bottom = -d
      dirLit.shadow.camera.top = d
      dirLit.shadow.camera.far = d * 2
      scene.add( dirLit )

      const dirLit2 = new THREE.DirectionalLight( 0x888888, 1 )
      dirLit2.position.set( 12, 12, -12 )
      scene.add( dirLit2 )

      
      const vidTex = new THREE.VideoTexture( videoDom.current )
       
      var envMat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: vidTex
      })
  
      var geom = new THREE.SphereGeometry(100, 32, 32)
    
      var skybox = new THREE.Mesh(geom, envMat)
      scene.add(skybox)

      //reflection env map
      cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding // temporary -- to prevent the material's shader from recompiling every frame
      });

      cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget )

      //true background
      const envmaploader = new THREE.PMREMGenerator(renderer)
      let envmap = envmaploader.fromCubemap(cubeRenderTarget.texture)
      scene.background = envmap.texture

      //load object
      let gltf = await modelLoader('food.glb')
      let model = gltf.scene
      model.scale.set(0.005, 0.005, 0.005)
      scene.add(model)

      //load animation
      let animations = gltf.animations
      mixer = new THREE.AnimationMixer( model )
      mixer.clipAction( animations[ 0 ] ).play()

      //define material
      const glossMat = new THREE.MeshPhysicalMaterial( {
        reflectivity: 0.8,
        roughness: 0.2,
        metalness: 0.3,
        color: 0xFF8866,
        clearcoat: 0.8,
        clearcoatRoughness: 0,
      })

      const matteMat = new THREE.MeshPhysicalMaterial({  
        color: 0xEEBB66,
        roughness: 0.6,
        reflectivity: 0.7
      })

      //apply material
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true
          obj.receiveShadow = true
        }

        if(obj.name.includes('Extrude')) {
          obj.material = matteMat
        }

        if (obj.name.includes('Capsule')) {
          obj.material = glossMat
        }

      })
      
      //render
      const clock = new THREE.Clock()
      const animate = () => {

        requestAnimationFrame( animate )
        
        //update reflection env map
        cubeCamera.update( renderer, scene )
        glossMat.envMap = cubeRenderTarget.texture

        //model animation
        let mixerUpdateDelta = clock.getDelta()
        mixer.update( mixerUpdateDelta )

				renderer.render( scene, camera );
        
      }

      animate()

    } 

    const modelLoader = (url) => {
      return new Promise((resolve, reject) => {
        loader.load(url, data => resolve(data), null, reject);
      })
    }

    const onResize = () => {

      const rect = wrapper.current.getBoundingClientRect()
      width = rect.width
      height = rect.height

      renderer.setPixelRatio( width/height )
      renderer.setSize( width, height )
      camera.aspect = width / height
			camera.updateProjectionMatrix()

    }

    init()

  })

  return (
    <>
    <video muted loop ref={videoDom} style={{display: 'none'}} src='/texture/env3.mp4' />
    <div className={cx(styles.wrapper, styles.card)} ref={wrapper}>
    </div>
    <div className={styles.title}>New Food & Farming</div>
    </>
  )
}
