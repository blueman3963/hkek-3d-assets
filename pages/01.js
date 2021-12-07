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
        material,
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

      const dirLit = new THREE.DirectionalLight( 0xffffff, 1 )
      scene.add( dirLit )
  
      //hdri
      /*
      const loader = new THREE.CubeTextureLoader().setPath( 'texture/cubeTexs/' )

			const textureCube = loader.load( [ '01.jpg', '01.jpg', '03.jpg', '03.jpg', '02.jpg', '02.jpg' ] )
			textureCube.encoding = THREE.sRGBEncoding
      scene.background = textureCube
      */
      
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
      } );

      cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget )

      console.log(cubeRenderTarget.texture)

      //true background
      const envmaploader = new THREE.PMREMGenerator(renderer)
      let envmap = envmaploader.fromCubemap(cubeRenderTarget.texture)
      scene.background = envmap.texture
      console.log(envmap)

      //load scene
      let gltf = await modelLoader('object.glb')
      let model = gltf.scene
      model.scale.set(0.005, 0.005, 0.005)
      scene.add(model)

      material = new THREE.MeshBasicMaterial( {
        envMap: cubeRenderTarget.texture,
        combine: THREE.MultiplyOperation,
        reflectivity: .7
      })
      
      model.children[0].material = material

      //render
      const animate = () => {

        requestAnimationFrame( animate )

        /*
        textureCube.image[0] = vidTex.image
        textureCube.image[1] = vidTex.image
        textureCube.image[2] = vidTex.image
        textureCube.image[3] = vidTex.image
        textureCube.image[4] = vidTex.image
        textureCube.image[5] = vidTex.image
        textureCube.needsUpdate = true
        */

        model.rotation.y += 0.002
        model.rotation.x += 0.002
        
        cubeCamera.update( renderer, scene )
        material.envMap = cubeRenderTarget.texture

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
    <video muted loop ref={videoDom} style={{display: 'none'}} src='/texture/env.mp4' />
    <div className={cx(styles.wrapper, styles.card)} ref={wrapper}>
    </div>
    <div className={styles.title}>01 - moving background with full reflection</div>
    </>
  )
}
