import { AcademicCapIcon, ArrowUpRightIcon, BriefcaseIcon, CodeBracketIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Cover } from "@/components/Cover";
import { Wall } from "@/components/Wall";
import { profile } from "@/content/profile";
import styles from "./page.module.css";

const FACT_ICONS = { work: BriefcaseIcon, school: AcademicCapIcon, place: MapPinIcon };

export default function Home() {
  return (
    <>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>wall</span>
          <a href={profile.links.portfolio} className={styles.navLink} target="_blank" rel="noreferrer">
            Portfolio
            <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="profile-name">
          <Cover className={styles.cover} />
          <div className={styles.heroBody}>
            <Image
              src={profile.photo}
              alt={`Profile photo of ${profile.name}`}
              width={148}
              height={148}
              className={styles.photo}
              priority
            />
            <div className={styles.identity}>
              <h1 id="profile-name" className={styles.name}>
                {profile.name}
              </h1>
              <p className={styles.headline}>{profile.headline}</p>
            </div>
            <div className={styles.heroActions}>
              <a href={profile.links.portfolio} className={styles.primaryLink} target="_blank" rel="noreferrer">
                See my portfolio
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <div className={styles.columns}>
          <aside className={styles.aside}>
            <section className={styles.card} aria-labelledby="intro-heading">
              <h2 id="intro-heading" className={styles.cardTitle}>
                Intro
              </h2>
              <p className={styles.bio}>{profile.bio}</p>
              <ul className={styles.facts}>
                {profile.facts.map((fact) => {
                  const Icon = FACT_ICONS[fact.icon];
                  return (
                    <li key={fact.label}>
                      <Icon aria-hidden="true" />
                      <span>{fact.label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={styles.card} aria-labelledby="about-heading">
              <h2 id="about-heading" className={styles.cardTitle}>
                About this wall
              </h2>
              <p className={styles.small}>
                A 2008 Facebook wall, rebuilt with today’s tools. Posts are saved in Supabase and show up for everyone
                live.
              </p>
              <ul className={styles.stack} aria-label="Built with">
                <li>Next.js</li>
                <li>React</li>
                <li>Supabase</li>
                <li>Realtime</li>
                <li>GIPHY</li>
              </ul>
              <a href={profile.links.source} className={styles.sourceLink} target="_blank" rel="noreferrer">
                <CodeBracketIcon aria-hidden="true" />
                View the source on GitHub
              </a>
            </section>
          </aside>

          <div className={styles.main}>
            <Wall owner={profile.name} />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        Made by{" "}
        <a href={profile.links.portfolio} target="_blank" rel="noreferrer">
          Jowie Jurado
        </a>{" "}
        with Next.js and Supabase
      </footer>
    </>
  );
}
