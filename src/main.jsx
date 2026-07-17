import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import workspaceImage from './assets/workspace.png'
import { db } from './firebase'
import './styles.css'
import './guestbook.css'

const GithubIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.2.65-.46v-1.7c-2.65.58-3.2-1.12-3.2-1.12-.43-1.1-1.06-1.4-1.06-1.4-.87-.6.07-.59.07-.59.96.07 1.47.98 1.47.98.86 1.46 2.25 1.04 2.8.8.09-.62.34-1.04.62-1.28-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.9.98-2.57-.1-.24-.42-1.21.09-2.53 0 0 .8-.25 2.62.98A9.1 9.1 0 0 1 12 7.5c.81 0 1.62.11 2.38.32 1.82-1.23 2.61-.98 2.61-.98.51 1.32.19 2.29.1 2.53.61.67.98 1.53.98 2.57 0 3.67-2.24 4.47-4.37 4.7.34.3.65.86.65 1.74v2.58c0 .26.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" fill="currentColor" /></svg>
const Arrow = () => <span aria-hidden="true">↗</span>

const formatGuestbookDate = (timestamp) => {
  if (!timestamp?.toDate) return '방금 전'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(timestamp.toDate())
}

function Guestbook() {
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    const entriesQuery = query(
      collection(db, 'guestbookEntries'),
      orderBy('createdAt', 'desc'),
      limit(12),
    )

    return onSnapshot(
      entriesQuery,
      (snapshot) => {
        setEntries(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        setLoading(false)
        setLoadError(false)
      },
      () => {
        setLoading(false)
        setLoadError(true)
      },
    )
  }, [])

  const submitEntry = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedMessage) {
      setStatus({ type: 'error', message: '이름과 메시지를 모두 입력해 주세요.' })
      return
    }

    setSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      await addDoc(collection(db, 'guestbookEntries'), {
        name: trimmedName,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
      })
      setName('')
      setMessage('')
      setStatus({ type: 'success', message: '메시지를 남겼어요. 고맙습니다!' })
    } catch {
      setStatus({ type: 'error', message: '메시지를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="guestbook" className="guestbook section-shell" aria-labelledby="guestbook-title">
      <div className="guestbook-heading">
        <div>
          <div className="section-label">05 / GUESTBOOK</div>
          <h2 id="guestbook-title">잠깐 머문 흔적을,<br /><em>한 줄로 남겨주세요.</em></h2>
        </div>
        <p>응원도, 인사도, 함께 나누고 싶은 이야기도 좋아요.<br />남겨주신 메시지는 이곳에 바로 기록됩니다.</p>
      </div>

      <div className="guestbook-layout">
        <form className="guestbook-form" onSubmit={submitEntry}>
          <label htmlFor="guest-name">이름</label>
          <input id="guest-name" type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength="20" placeholder="어떻게 불러드릴까요?" autoComplete="name" disabled={submitting} />
          <label htmlFor="guest-message">메시지</label>
          <textarea id="guest-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength="300" rows="5" placeholder="자유롭게 메시지를 남겨주세요." disabled={submitting} />
          <div className="guestbook-form-footer">
            <span>{message.length} / 300</span>
            <button type="submit" disabled={submitting}>{submitting ? '남기는 중...' : '방명록 남기기'} <Arrow /></button>
          </div>
          <p className={`form-status ${status.type}`} aria-live="polite">{status.message}</p>
        </form>

        <div className="guestbook-list" aria-live="polite" aria-busy={loading}>
          {loading && <p className="guestbook-state">메시지를 불러오는 중...</p>}
          {loadError && <p className="guestbook-state error">방명록을 불러오지 못했어요.<br />잠시 후 다시 시도해 주세요.</p>}
          {!loading && !loadError && !entries.length && <p className="guestbook-state">아직 남겨진 메시지가 없어요.<br />첫 번째 인사를 건네주세요.</p>}
          {entries.map((entry) => (
            <article className="guestbook-entry" key={entry.id}>
              <div className="entry-meta"><strong>{entry.name}</strong><time>{formatGuestbookDate(entry.createdAt)}</time></div>
              <p>{entry.message}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function App() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll(); window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <>
    <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
      <a className="wordmark" href="#top" aria-label="노지섭 소개 첫 화면으로">JISUB NO<span>.</span></a>
      <nav aria-label="주요 섹션"><a href="#now">Now</a><a href="#style">Style</a><a href="#guestbook">Guestbook</a></nav>
      <a className="header-link" href="https://github.com/no-jisub" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
    </header>

    <main id="top">
      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="eyebrow"><i /> BACKEND DEVELOPER · YONGIN, KOREA</div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">노지섭 <span>/</span> JISUB NO</p>
            <h1 id="hero-title">아이디어를<br /><em>실제 서비스</em>로<br />구현합니다.</h1>
            <p className="intro">Java와 Spring Boot를 중심으로, 잘 작동하는 구조를 먼저 설계하고 그 위에 쓰임새 있는 경험을 만듭니다.</p>
            <div className="hero-actions">
              <a className="button primary" href="https://github.com/no-jisub" target="_blank" rel="noreferrer"><GithubIcon /> GitHub 보기</a>
              <a className="button secondary" href="#rhythm">만드는 과정 <Arrow /></a>
            </div>
          </div>
          <figure className="hero-visual">
            <img src={workspaceImage} alt="코드 화면과 아이디어 설계 메모가 놓인 어두운 작업 책상" />
            <figcaption><span>01</span> from sketch to service</figcaption>
          </figure>
        </div>
        <div className="scroll-note"><span>SCROLL TO EXPLORE</span><b /></div>
      </section>

      <section className="about section-shell" aria-labelledby="about-title">
        <div className="section-label">01 / ABOUT</div>
        <div className="about-layout">
          <h2 id="about-title">기술은 목적지가 아니라,<br />작동하는 서비스를<br /><em>만들기 위한 도구.</em></h2>
          <div className="about-copy">
            <p>강남대학교 소프트웨어전공 학생으로서 Java와 Spring Boot를 중심으로 백엔드를 공부하고 있습니다. 모바일 앱, 웹 서비스, AI 프로젝트를 직접 기획하고 구현해 왔습니다.</p>
            <p>제가 오래 붙잡는 질문은 “이 기능이 실제로 어떻게 흘러가야 하는가”입니다. 화면의 한 번의 동작이 데이터와 서버를 지나 다시 사용자에게 닿는 순간까지 설계합니다.</p>
          </div>
        </div>
        <div className="trait-row" aria-label="핵심 키워드"><span>Java &amp; Spring Boot</span><span>Service Builder</span><span>Logical Thinker</span><span>Creative Problem Solver</span></div>
      </section>

      <section id="now" className="now section-shell" aria-labelledby="now-title">
        <div className="section-head"><div className="section-label">02 / NOW</div><p>요즘은 서비스를 더 단단하게 만드는<br />기초 체력에 집중하고 있습니다.</p></div>
        <h2 id="now-title">Currently<br /><em>building depth.</em></h2>
        <div className="focus-grid">
          <article className="focus-card featured"><span className="card-number">01</span><h3>Spring Boot<br />의 깊이</h3><p>요구사항을 API, 도메인, 예외 흐름으로 나누고 안정적인 백엔드의 기준을 쌓는 중입니다.</p><small>JAVA · SPRING BOOT</small></article>
          <article className="focus-card"><span className="card-number">02</span><h3>데이터가<br />남기는 구조</h3><p>테이블 관계와 쿼리의 이유를 이해하며 SQLD와 데이터 모델링을 공부합니다.</p><small>MARIADB · SQL</small></article>
          <article className="focus-card"><span className="card-number">03</span><h3>대화하는<br />서비스</h3><p>AI 대화 분석, 게임 서버, 실시간 통신이 만나는 서비스 경험을 실험합니다.</p><small>AI · WEBSOCKET</small></article>
        </div>
      </section>

      <section id="style" className="style section-shell" aria-labelledby="style-title">
        <div className="style-prompt"><span>HOW I WORK</span><div className="prompt-bar"><b>구조와 흐름을 먼저 생각합니다</b><i>↵</i></div></div>
        <div className="style-layout"><div><div className="section-label">03 / STYLE</div><h2 id="style-title">논리로 정리하고,<br /><em>실험으로 답합니다.</em></h2></div><div className="style-copy"><p>복잡한 문제를 기능과 역할 단위로 분해합니다. 그 다음, 정해진 답을 따르기보다 더 효율적이고 재미있는 방법이 있는지 작게 만들어 검증합니다.</p><p>혼자 깊게 몰입해 구조를 다듬는 시간도, 팀원과 아이디어를 구체화하는 대화도 모두 중요하게 생각합니다.</p><div className="stack"><span>Java</span><span>Spring Boot</span><span>MariaDB</span><span>Redis</span><span>JWT</span><span>WebSocket</span><span>React Native</span><span>GitHub Actions</span></div></div></div>
      </section>

      <section id="rhythm" className="rhythm section-shell" aria-labelledby="rhythm-title">
        <div className="section-label">04 / RHYTHM</div><h2 id="rhythm-title">생각은 멈추지 않고,<br /><em>다음 형태로 이동합니다.</em></h2>
        <ol className="process">
          <li><b>01</b><strong>생각</strong><p>불편함과 가능성을 발견합니다.</p></li>
          <li><b>02</b><strong>메모</strong><p>핵심을 짧은 언어로 붙잡습니다.</p></li>
          <li><b>03</b><strong>설계</strong><p>역할과 데이터의 흐름을 그립니다.</p></li>
          <li><b>04</b><strong>개발</strong><p>작은 단위로 실제 동작을 만듭니다.</p></li>
          <li><b>05</b><strong>화면</strong><p>사용자가 만나는 경험을 확인합니다.</p></li>
          <li><b>06</b><strong>개선</strong><p>다시 관찰하고 더 나은 다음을 찾습니다.</p></li>
        </ol>
      </section>

      <Guestbook />

      <section id="contact" className="contact section-shell" aria-labelledby="contact-title">
        <div className="contact-card"><p className="section-label">06 / CONTACT</p><h2 id="contact-title">프로젝트와 기술 이야기,<br /><em>편하게 연결해요.</em></h2><p className="contact-note">새로운 문제를 함께 정리하거나, 작동하는 서비스를 만들고 싶은 이야기를 기다립니다.</p><a className="contact-link" href="https://github.com/no-jisub" target="_blank" rel="noreferrer"><GithubIcon /> github.com/no-jisub <Arrow /></a></div>
      </section>
    </main>
    <footer><span>© 2026 JISUB NO</span><a href="#top">Back to top ↑</a></footer>
  </>
}

createRoot(document.getElementById('root')).render(<App />)
