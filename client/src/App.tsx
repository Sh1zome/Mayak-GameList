import React, { useState, useEffect, useRef } from 'react';
import './styles.scss';

interface ZonaGame {
  name: string;
  russian: 'Присутствует' | 'Отсутствует' | 'Есть субтитры';
  control: string[];
  violation: string[];
  age: 'Дети (6-12 лет)' | 'Подростки (12-16 лет)' | 'Юноши (16-18 лет)' | 'Взрослые (18 и более лет)';
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  screenshots: string[];
  description: string;
  trailer: string;
  cardHeader: string;
  mobileCardHeader: string;
}

interface Submode {
  name: string;
  description: string;
  header: string;
}

interface ArenaGame extends Omit<
  ZonaGame,
  'tags' | 'screenshots' | 'description' | 'trailer' | 'cardHeader' | 'mobileCardHeader'
> {
  tags: string[];
  screenshots: string[];
  description: string;
  trailer: string;
  cardHeader: string;
  mobileCardHeader: string;
  submodes: Submode[];
}

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<'zona' | 'arena' | 'autosim' | 'ps' | null>(null);
  const [zonaGames, setZonaGames] = useState<ZonaGame[]>([]);
  const [arenaGames, setArenaGames] = useState<ArenaGame[]>([]);
  const [autoGames, setAutoGames] = useState<ZonaGame[]>([]);
  const [psGames, setPsGames] = useState<ZonaGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<ZonaGame | ArenaGame | null>(null);
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fade, setFade] = useState<'in' | 'out'>('in');

  const thumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}games.json`).then(res => res.json()).then(data => setZonaGames(data.games || []));
    fetch(`${import.meta.env.BASE_URL}arena.json`).then(res => res.json()).then(data => setArenaGames(data.games || []));
    fetch(`${import.meta.env.BASE_URL}autosim.json`).then(res => res.json()).then(data => setAutoGames(data.games || []));
    fetch(`${import.meta.env.BASE_URL}ps.json`).then(res => res.json()).then(data => setPsGames(data.games || []));
  }, []);

  useEffect(() => {
    const handleBack = () => {
      if (selectedGame) {
        closeDetails();
      }
    };
    window.addEventListener('popstate', handleBack);
    if (selectedGame) window.history.pushState({ game: selectedGame.name }, '');
    return () => window.removeEventListener('popstate', handleBack);
  }, [selectedGame]);

  // ✅ Скролл вверх при смене вкладки (плавно)
  const handleSectionChange = (section: 'zona' | 'arena' | 'autosim' | 'ps') => {
    setFade('out');
    setTimeout(() => {
      setCurrentSection(section);
      setSearchQuery('');
      setSelectedTags([]);
      setSelectedGame(null);
      setScreenshotIndex(0);
      setFade('in');
      setBurgerOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // ✅ Моментальный возврат вверх при выходе из игры
  const closeDetails = () => {
    setFade('out');
    setTimeout(() => {
      setSelectedGame(null);
      setScreenshotIndex(0);
      setFade('in');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 200);
  };

  const getUniqueTags = (games: ZonaGame[]) => {
    const allTags = games.flatMap(g => g.tags);
    return [...new Set(allTags)].sort();
  };

  const filteredGames = () => {
    let list: (ZonaGame | ArenaGame)[] =
      currentSection === 'zona' ? zonaGames : 
      currentSection === 'arena' ? arenaGames : 
      currentSection === 'autosim' ? autoGames :
      psGames
    if (searchQuery)
      list = list.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedTags.length)
      list = list.filter(g => selectedTags.every(tag => g.tags.includes(tag)));
    return list;
  };

  const nextScreenshot = () => {
    if (!selectedGame) return;
    const total = selectedGame.screenshots.length + 1;
    const next = (screenshotIndex + 1) % total;
    setScreenshotIndex(next);
    requestAnimationFrame(() => scrollThumbIntoView(next));
  };

  const prevScreenshot = () => {
    if (!selectedGame) return;
    const total = selectedGame.screenshots.length + 1;
    const prev = screenshotIndex === 0 ? total - 1 : screenshotIndex - 1;
    setScreenshotIndex(prev);
    requestAnimationFrame(() => scrollThumbIntoView(prev));
  };

  const scrollThumbIntoView = (index: number) => {
    if (!thumbsRef.current) return;
    const container = thumbsRef.current;
    const items = Array.from(container.querySelectorAll<HTMLImageElement>('.thumb-item'));
    const el = items[index];
    if (el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.left - containerRect.left - (containerRect.width / 2) + (elRect.width / 2);
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  // ✅ Добавлен scrollTo при открытии игры
  const renderGameCard = (game: ZonaGame) => {
    const isZonaOrAuto = currentSection === 'zona' || currentSection === 'autosim' || currentSection === 'ps';
    const color =
      game.russian === 'Присутствует' ? '#25d366' :
      game.russian === 'Есть субтитры' ? '#ffcc00' :
      '#ff4d4d';

    const handleOpenGame = () => {
      setSelectedGame(game);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    return (
      <div key={game.name} className="game-card" onClick={handleOpenGame}>
        <img
          src={isMobile ? game.mobileCardHeader : game.cardHeader}
          alt={game.name}
          className="card-header"
        />
        {isZonaOrAuto && (
          <div
            className="lang-indicator"
            style={{ backgroundColor: color }}
            aria-hidden
          >
            Русский: {game.russian}
          </div>
        )}
        <h3>{game.name}</h3>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo" onClick={() => window.location.reload()}>
          <img src={`${import.meta.env.BASE_URL}img/logomayak.svg`} alt="" />
        </div>

        <nav className={`nav ${burgerOpen ? 'open' : ''}`}>
          <button onClick={() => handleSectionChange('zona')}>VR-ЗОНА</button>
          <button onClick={() => handleSectionChange('arena')}>VR-АРЕНА</button>
          <button onClick={() => handleSectionChange('autosim')}>АВТОСИМУЛЯТОР</button>
          <button onClick={() => handleSectionChange('ps')}>PS ИГРЫ</button>
        </nav>

        <button
          className={`burger ${burgerOpen ? 'open' : ''}`}
          onClick={() => setBurgerOpen(!burgerOpen)}
          aria-label="Меню"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect y="0" width="22" height="2" rx="1" fill="white"/>
            <rect y="7" width="22" height="2" rx="1" fill="white"/>
            <rect y="14" width="22" height="2" rx="1" fill="white"/>
          </svg>
        </button>
      </header>

      {burgerOpen && <div className="burger-overlay" onClick={() => setBurgerOpen(false)} />}

      <div className={`content fade-${fade}`}>
        {!currentSection && !selectedGame && (
          <div className="intro">
            <img src={`${import.meta.env.BASE_URL}img/Logo.svg`} alt="Лого" />
            <h1>Список установленных игр</h1>
            {isMobile && (
              <button
                className={`burger ${burgerOpen ? 'open' : ''}`}
                onClick={() => setBurgerOpen(!burgerOpen)}
              >Выбрать зону</button>
            )}
          </div>
        )}

        {currentSection && !selectedGame && (
          <>
            <div className="search-filter-row">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {isMobile && (
                <button className="filter-btn" onClick={() => setFilterOpen(true)}>Фильтр</button>
              )}
            </div>

            {!isMobile && (
              <div className="tags-filter">
                {getUniqueTags(
                  currentSection === 'zona' ? zonaGames :
                  currentSection === 'arena' ? arenaGames :
                  currentSection === 'autosim' ? autoGames :
                  psGames
                ).map(tag => (
                  <button
                    key={tag}
                    className={selectedTags.includes(tag) ? 'active' : ''}
                    onClick={() => handleTagChange(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="games-grid">
              {filteredGames().map(g => renderGameCard(g))}
            </div>
          </>
        )}

        {selectedGame && (
          <div className="game-page">
            <button className="close-btn" onClick={closeDetails}>← Назад</button>
            <h2>{selectedGame.name}</h2>

            <div className="game-top-row">
              <img
                src={isMobile ? selectedGame.mobileCardHeader : selectedGame.cardHeader}
                alt={selectedGame.name}
                className="game-header"
              />
              <div className="game-description">{selectedGame.description}</div>
              <div className="game-info">
                <p><strong>Русский язык:</strong> {selectedGame.russian}</p>
                <p><strong>Управление:</strong> {selectedGame.control.join(', ')}</p>
                <p><strong>Опасности:</strong> {selectedGame.violation.join(', ')}</p>
                <p><strong>Возраст:</strong> {selectedGame.age}</p>
                {/* <p><strong>Сложность:</strong> {selectedGame.difficulty}</p> */}
                <p><strong>Теги:</strong> {selectedGame.tags.join(', ')}</p>
              </div>
            </div>

            {'submodes' in selectedGame && selectedGame.submodes.length > 0 && (
              <div className="submodes-section">
                <h3>Подрежимы</h3>
                <div className="submodes-grid">
                  {selectedGame.submodes.map((submode, index) => (
                    <div key={index} className="submode-card">
                      <img src={submode.header} alt={submode.name} />
                      <div>
                        <h4>{submode.name}</h4>
                        <p>{submode.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="slider-container">
              <div className="main-slide">
                {selectedGame.trailer && screenshotIndex === 0 ? (
                  <video
                    controls
                    src={selectedGame.trailer}
                    poster={selectedGame.mobileCardHeader}
                  />
                ) : (
                  <img
                    src={
                      selectedGame.trailer
                        ? selectedGame.screenshots[screenshotIndex - 1]
                        : selectedGame.screenshots[screenshotIndex]
                    }
                    alt="screenshot"
                  />
                )}
              </div>

              <div className="thumbs" ref={thumbsRef}>
                <button className="arrow left" onClick={prevScreenshot}>❮</button>

                <div className="thumbs-inner">
                  {(selectedGame.trailer
                    ? [selectedGame.trailer, ...selectedGame.screenshots]
                    : selectedGame.screenshots
                  ).map((src, i) => (
                    <img
                      key={i}
                      src={selectedGame.trailer && i === 0 ? selectedGame.cardHeader : src}
                      alt={`preview-${i}`}
                      className={`thumb-item ${
                        i === screenshotIndex ? "active" : ""
                      }`}
                      onClick={() => {
                        setScreenshotIndex(i);
                        requestAnimationFrame(() => scrollThumbIntoView(i));
                      }}
                    />
                  ))}
                </div>

                <button className="arrow right" onClick={nextScreenshot}>❯</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="filter-modal" onClick={() => setFilterOpen(false)}>
          <div className="filter-window" onClick={e => e.stopPropagation()}>
            <button className="close-filter" onClick={() => setFilterOpen(false)}>✕</button>
            {getUniqueTags(
              currentSection === 'zona' ? zonaGames :
              currentSection === 'arena' ? arenaGames :
              currentSection === 'autosim' ? autoGames :
              psGames
            ).map(tag => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? 'active' : ''}
                onClick={() => handleTagChange(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
