import styles from '../styles/Home.module.scss'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEffect, useRef } from 'react'
import cx from 'classnames'
import { DoubleSide } from 'three'

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
      const ambLit = new THREE.AmbientLight( 0xffffff, 0.6)
      scene.add( ambLit )
      const hemLit = new THREE.HemisphereLight( 0x5599ff, 0x777722, .4)
      scene.add( hemLit )
      const dirLit = new THREE.DirectionalLight( 0xffffff, .2 )
      scene.add( dirLit )
  
      //hdri
      const textureLoader = new THREE.TextureLoader().setPath( 'texture/' )

      const texLoader = (url) => {
        return new Promise((resolve, reject) => {
          textureLoader.load(url, data => resolve(data), null, reject);
        })
      }
      const envMap = await texLoader('env.jpeg')   
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      envMap.encoding = THREE.sRGBEncoding;   
      
      const vidTex = new THREE.VideoTexture( videoDom.current )

      //load scene

      material = new THREE.MeshPhysicalMaterial( {
        side: THREE.DoubleSide,
        roughness: 0,  
        transmission: .8,
        thickness: 10,
      })

      let gltf = await modelLoader('object2.glb')
      const modelGeo = gltf.scene.children[0].geometry.clone()
      const model = new THREE.Mesh(modelGeo, material)
      model.scale.set(0.005, 0.005, 0.005)
      model.position.set(8,0,0)
      //scene.add(model)

      const bgGeometry = new THREE.PlaneGeometry(40, 40)
      const bgMaterial = new THREE.MeshBasicMaterial({ map: vidTex })
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
      bgMesh.position.set(0, 0, -10)
      scene.add(bgMesh)

      const geometry = new THREE.IcosahedronGeometry(5, 0)

      const mesh = new THREE.Mesh(geometry, material)

      scene.add(mesh)
      
      //render
      const animate = () => {

        requestAnimationFrame( animate )

        mesh.rotation.y += 0.002
        mesh.rotation.x += 0.002

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
    <video muted loop ref={videoDom} style={{display: 'none'}} src='/texture/sqr2.mp4' />
    <div className={cx(styles.wrapper, styles.card)} ref={wrapper}>
    </div>
    <div className={styles.title}>04 - moving background with transparent object</div>
    </>
  )
}
