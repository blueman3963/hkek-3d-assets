import '../styles/globals.css'
import Link from 'next/link'
import styles from '../styles/layout.module.scss'


function MyApp({ Component, pageProps }) {
  return <>
    <div className={styles.nav}>
    <Link href='/01'><a className={styles.button}>New Robot & AI</a></Link>
    <Link href='/02'><a className={styles.button}>New Health</a></Link>
    <Link href='/03'><a className={styles.button}>New Food</a></Link>
    </div>
    <Component {...pageProps} />
  </>
}

export default MyApp
