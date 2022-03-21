import styles from '../styles/Home.module.scss'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEffect, useRef } from 'react'
import cx from 'classnames'

export default function Home() {

  const wrapper = useRef()
  const videoDom = useRef()

  useEffect(() => {

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
      wrapper.current.appendChild( renderer.domElement )

      camera = new THREE.PerspectiveCamera( 30, 0, 0.1, 1000 )
			camera.position.set( 0, 0, 48 )

      scene = new THREE.Scene()

      window.addEventListener('resize', onResize)
      onResize()

      controls = new OrbitControls( camera, renderer.domElement )

      //light setting
      const ambLit = new THREE.AmbientLight( 0xBBBBBB ); // soft white light
      scene.add( ambLit )

      const Lits = new THREE.Group()
      scene.add( Lits )

      const Lit1 = new THREE.PointLight( 0xAA7777, 1 )
      Lit1.position.set( 0, 4, 12 )
      Lits.add( Lit1 )

      const Lit2 = new THREE.PointLight( 0x4444AA, 1 )
      Lit2.position.set( 4, 0, -12 )
      Lits.add( Lit2 )

      const Lit3 = new THREE.PointLight( 0x77AA77, 1 )
      Lit3.position.set( 12, 0, -8 )
      Lits.add( Lit3 )

      const Lit4 = new THREE.PointLight( 0x777744, 1 )
      Lit4.position.set( -12, 0, 0 )
      Lits.add( Lit4 )

      const Lit5 = new THREE.PointLight( 0x447777, 1 )
      Lit5.position.set( 0, 12, 4 )
      Lits.add( Lit5 )

      const Lit6 = new THREE.PointLight( 0x774477, 1 )
      Lit6.position.set( 0, -12, 0 )
      Lits.add( Lit6 )

      

      
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
      let gltf = await modelLoader('health.glb')
      let model = gltf.scene
      model.scale.set(0.005, 0.005, 0.005)
      scene.add(model)

      //load animation
      let animations = gltf.animations
      mixer = new THREE.AnimationMixer( model )
      mixer.clipAction( animations[ 0 ] ).play()

      //define material

      const glossMat = new THREE.MeshPhysicalMaterial( {
        reflectivity: 0.7,
        roughness: 0.6,
        metalness: 0.2,
        color: 0xCCCCFF
      })

      //apply material
      model.traverse(obj => {
        if (obj.isMesh) {
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

        //light rotation
        Lits.rotation.y += 0.02
        Lits.rotation.x += 0.02

        //model animation
        let mixerUpdateDelta = clock.getDelta()
        mixer.update( mixerUpdateDelta )
        model.rotation.x = Math.sin(clock.getElapsedTime()/2)/2

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
    <video muted loop ref={videoDom} style={{display: 'none'}} src='/texture/env2.mp4' />
    <div className={cx(styles.wrapper, styles.card)} ref={wrapper}>
    </div>
    <div className={styles.title}>New Health</div>
    </>
  )
}
