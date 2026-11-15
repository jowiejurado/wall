import Image from "next/image";
import { Wall } from "@/components/Wall";
import { profile } from "@/content/profile";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.topInner}>
          <span className={styles.logo}>wall</span>
        </div>
      </header>

      <main className={styles.page}>
        <aside className={styles.sidebar}>
          <Image
            src={profile.photo}
            alt={`Profile photo of ${profile.name}`}
            width={200}
            height={240}
            className={styles.photo}
            priority
          />

          <section className={styles.info} aria-labelledby="info-heading">
            <h2 id="info-heading" className={styles.infoHeading}>
              Information
            </h2>
            <dl>
              {profile.info.map((item) => (
                <div key={item.label} className={styles.infoRow}>
                  <dt>{item.label}</dt>
                  <dd>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>

        <div className={styles.main}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.status}>{profile.status}</p>
          <Wall owner={profile.name} />
        </div>
      </main>
    </>
  );
}
