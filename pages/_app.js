import '../styles/globals.css'
import Link from 'next/link'
import styles from '../styles/layout.module.scss'


function MyApp({ Component, pageProps }) {
  return <>
    <div className={styles.nav}>
    <Link href='/01'><a className={styles.button}>01</a></Link>
    <Link href='/02'><a className={styles.button}>02</a></Link>
    <Link href='/03'><a className={styles.button}>03</a></Link>
    <Link href='/04'><a className={styles.button}>04</a></Link>
    <Link href='/05'><a className={styles.button}>05</a></Link>
    <Link href='/06'><a className={styles.button}>06</a></Link>
    </div>
    <Component {...pageProps} />
  </>
}

export default MyApp
