import React from 'react';
import { createRoot } from 'react-dom/client';
import Dither from './components/Dither.jsx';
import './styles.css';

const pages = {
  'projects.html': { title: 'Projects', description: 'Selected projects by Adhiraj Singh.' },
  'filmmaking.html': { title: 'Filmmaking', description: 'Filmmaking by Adhiraj Singh.' },
  'albumwall.html': { title: 'Album Wall', description: 'Music I love right now' },
  'credits.html': { title: 'Scrapbook', blank: true },
};

function Navigation({ current }) {
  const links = [
    ['Album Wall', 'albumwall.html'],
    ['Filmmaking', 'filmmaking.html'],
    ['Home', 'index.html'],
    ['Projects', 'projects.html'],
    ['Scrapbook', 'credits.html'],
  ];
  React.useLayoutEffect(() => {
    const nav = document.querySelector('.site-nav');
    const strip = nav?.querySelector('.nav-links');
    const active = strip?.querySelector('[aria-current="page"]');
    if (!nav || !strip || !active) return;
    const align = () => {
      const n = nav.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      strip.style.setProperty('--nav-shift', `${n.left + n.width / 2 - a.left - a.width / 2}px`);
    };
    align();
    window.addEventListener('resize', align);
    return () => window.removeEventListener('resize', align);
  }, [current]);

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="nav-links">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={navigateFromNav} aria-current={current === href ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function navigateFromNav(event) {
  const link = event.currentTarget;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
  event.preventDefault();
  const nav = link.closest('.site-nav');
  const strip = nav?.querySelector('.nav-links');
  if (strip) {
    const n = nav.getBoundingClientRect();
    const a = link.getBoundingClientRect();
    const currentShift = Number.parseFloat(strip.style.getPropertyValue('--nav-shift')) || 0;
    const targetShift = currentShift + n.left + n.width / 2 - a.left - a.width / 2;
    strip.style.setProperty('--nav-shift', `${targetShift}px`);
  }
  nav?.classList.add('is-navigating');
  window.setTimeout(() => { window.location.href = link.href; }, 160);
}

function HomePage() {
  return (
    <>
      <Navigation current="index.html" />
      <main>
        <header className="home-hero" id="home">
          <div className="hero-copy">
            <p className="greeting">Hi, I’m</p>
            <h1>Adhiraj Singh</h1>
            <p className="descriptor">B.Tech Chemical Engineering | Cybersecurity Enthusiast | Aerospace Enthusiast | Editor-Filmmaker</p>
          </div>
          <img className="profile-image" src="/me.png" alt="Adhiraj Singh" width="400" height="400" />
        </header>

        <section className="tech-home" id="technical-skills" aria-labelledby="skills-title">
          <header className="tech-intro"><h2 id="skills-title">Tech Stack</h2></header>
          <section className="logo-strip" aria-label="Selected technologies">
            {logoSkills.map(([name, icon]) => <span className="tech-logo" key={name} tabIndex="0" aria-label={name} data-tooltip={name}><img src={icon === 'css3' ? '/logos/css3.svg' : `https://cdn.simpleicons.org/${icon}/F0EFED`} alt="" loading="lazy" /></span>)}
          </section>
          <div className="skill-columns">
            <section className="skill-discipline"><h2>Software &amp; technology</h2>{skillGroups.slice(0, 5).map(g => <SkillGroup key={g.title} title={g.title}>{g.text}</SkillGroup>)}</section>
            <section className="skill-discipline"><h2>Engineering</h2>{skillGroups.slice(5).map(g => <SkillGroup key={g.title} title={g.title}>{g.text}</SkillGroup>)}</section>
          </div>
        </section>

        <footer className="content-section contact-section" id="contact">
          <h2 id="contact-title">Contact</h2>
          <nav className="social-icons contact-icons" aria-label="Contact and social links">
            <a href="mailto:adhirajsingh2.9.07@gmail.com" aria-label="Email Adhiraj Singh Gmail" title="adhirajsingh2.9.07@gmail.com"><img src="/logos/mail.svg" alt="" width="24" height="24" /></a>
            <a href="mailto:25je0608@iitism.ac.in" aria-label="Email Adhiraj Singh IIT ISM" title="25je0608@iitism.ac.in"><img src="/logos/mail.svg" alt="" width="24" height="24" /></a>
            <a href="https://github.com/adhiirraj" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><img src="/logos/github.svg" alt="" width="24" height="24" /></a>
            <a href="https://www.instagram.com/adhiirraj/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><img src="/logos/instagram.svg" alt="" width="24" height="24" /></a>
            <a href="https://www.linkedin.com/in/adhiirraj/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><img src="/logos/linkedin.svg" alt="" width="24" height="24" /></a>
            <a href="https://x.com/25je0608" aria-label="X" target="_blank" rel="noopener noreferrer"><img src="/logos/x.svg" alt="" width="24" height="24" /></a>
            <a href="https://www.youtube.com/@adhiirraj" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><img src="/logos/youtube.svg" alt="" width="24" height="24" /></a>
          </nav>
        </footer>
      </main>
    </>
  );
}

function SimplePage({ title, description, current }) {
  return (
    <>
      <Navigation current={current} />
      {title === 'Scrapbook' ? <main className="blank-page" aria-label="Scrapbook" /> : (
        title === 'Album Wall' ? <AlbumWall /> :
        <main className="simple-page">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </main>
      )}
    </>
  );
}


function AlbumWall() {
  const [albums, setAlbums] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    fetch(\`${import.meta.env.BASE_URL}albumwall.json\`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(\`Album data request failed: \${response.status}\`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.tracks)) throw new Error('Album data has an invalid format');
        setAlbums(data.tracks);
        setFailed(false);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Could not load the Spotify album wall:', error);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="album-wall-page">
      <h1>Music I love right now</h1>
      {loading && <p className="album-wall-message">Loading album covers…</p>}
      {!loading && failed && <p className="album-wall-message">The album wall could not be loaded. Please try again later.</p>}
      {!loading && !failed && albums.length === 0 && <p className="album-wall-message">The playlist is being synced. Check back shortly.</p>}
      <div className="album-wall-grid">
        {albums.map(album => (
          <figure key={album.id}>
            <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label={\`Open \${album.title} on Spotify\`}>
              <img src={album.image} alt={\`\${album.title} by \${album.artist}\`} loading="lazy" />
            </a>
            <figcaption>
              <strong>{album.title}</strong>
              <span>{album.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <a className="playlist-link" href="https://open.spotify.com/playlist/37i9dQZF1Epp7akT4x0KST" target="_blank" rel="noreferrer">Open playlist on Spotify</a>
    </main>
  );
}


const logoSkills = [
  ['Python', 'python'], ['C', 'c'], ['JavaScript', 'javascript'], ['Bash', 'gnubash'],
  ['HTML5', 'html5'], ['CSS3', 'css3'], ['Wireshark', 'wireshark'], ['Linux', 'linux'],
  ['Flask', 'flask'], ['FastAPI', 'fastapi'], ['NumPy', 'numpy'], ['SciPy', 'scipy'],
  ['pandas', 'pandas'], ['scikit-learn', 'scikitlearn'], ['MATLAB', 'matlab'],
  ['RISC-V', 'riscv'], ['Git', 'git'], ['GitHub', 'github'], ['Docker', 'docker'], ['FFmpeg', 'ffmpeg'],
];

function SkillGroup({ title, children }) {
  return <section className="skill-group"><h3>{title}</h3><p>{children}</p></section>;
}

const skillGroups = [
    { title: 'Programming languages', text: 'Python · C · JavaScript · Bash · HTML5 · CSS3' },
    { title: 'Cybersecurity & digital forensics', text: 'Steganography · Steganalysis · Digital Forensics · Network Traffic Analysis · Wireshark · Scapy · tshark · tcpdump · IPsec · IKEv2 · ESP · PCAP / PCAPNG Analysis · File Format Analysis' },
    { title: 'Cryptography & secure systems', text: 'ML-KEM-512 (CRYSTALS-Kyber) · ML-DSA-44 (CRYSTALS-Dilithium) · AES-256-GCM · AES-CBC · ECDH (P-256) · wolfSSL · wolfCrypt · PyCryptodome' },
    { title: 'Backend & web', text: 'Flask · FastAPI · REST APIs · WebSockets · SQLite · Vanilla JavaScript · Bootstrap 5 · Tailwind CSS' },
    { title: 'AI, data & scientific computing', text: 'NumPy · SciPy · pandas · scikit-learn · Random Forest Classification · MATLAB · Matplotlib' },
    { title: 'Embedded systems & hardware', text: 'RISC-V · VexRiscv · LiteX · LiteEth · Verilator · Bare-metal C · GCC · GNU Make' },
    { title: 'Chemical & aerospace engineering', text: 'COMSOL Multiphysics · SimScale · MATLAB · OpenRocket · NASA CEA' },
    { title: 'Development & infrastructure', text: 'Git · GitHub · GitHub Actions · Docker · Docker Compose · Linux · pytest · Ruff · mypy · FFmpeg' },
  ];

function SiteBackground() {
  return (
    <div className="site-background" aria-hidden="true">
      <Dither
        style={{ width: '100%', height: '100%', position: 'relative' }}
        waveColor="#ff0000"
        backgroundColor="#000000"
        ditherMode="bayer"
        colorNum={4}
        pixelSize={2}
        waveSpeed={0.05}
        waveFrequency={3}
        waveAmplitude={0.3}
        mouseEffect="erase"
        mouseRadius={0.3}
        scale={0.6}
        contrast={0.5}
        brightness={-0.19}
        enableMouseInteraction={false}
        clickRipple={false}
        intro={false}
      />
      <div className="background-dim" />
    </div>
  );
}

const filename = window.location.pathname.split('/').pop() || 'index.html';
const page = pages[filename];
document.title = page ? `${page.title} | Adhiraj` : 'Adhiraj Singh';

createRoot(document.getElementById('root')).render(
  <>
    <SiteBackground />
    <div className="app-content">
      {page ? <SimplePage title={page.title} description={page.description} current={filename} /> : <HomePage />}
    </div>
  </>
);
