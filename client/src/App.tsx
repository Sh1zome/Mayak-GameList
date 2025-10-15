import React, { useState, useEffect } from 'react';
import './styles.scss';

// Тип для данных игры в VR-Зона
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
  const [currentSection, setCurrentSection] = useState<'zona' | 'arena' | null>(null);
  const [zonaGames, setZonaGames] = useState<ZonaGame[]>([]);
  const [arenaGames, setArenaGames] = useState<ArenaGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<ZonaGame | ArenaGame | null>(null);
  const [screenshotIndex, setScreenshotIndex] = useState(0);

  // Загрузка данных из API
  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data: ZonaGame[]) => setZonaGames(data))
      .catch((err) => {
        console.error('Error loading games:', err);
        setZonaGames([]);
      });
  }, []);

  // Загрузка данных из JSON
  useEffect(() => {
    fetch('../games.json')
      .then((res) => res.json())
      .then((data) => setZonaGames(data.games || []))
      .catch((err) => console.error('Error loading zona games:', err));

    fetch('./arena.json')
      .then((res) => res.json())
      .then((data) => setArenaGames(data.games || []))
      .catch((err) => console.error('Error loading arena games:', err));
  }, []);

  const getUniqueTags = () => {
    const allTags = zonaGames.flatMap((game) => game.tags);
    return [...new Set(allTags)].sort();
  };

  const filteredGames = () => {
    let gamesList: (ZonaGame | ArenaGame)[] = currentSection === 'zona' ? zonaGames : arenaGames;
    if (searchQuery) {
      gamesList = gamesList.filter((game) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (currentSection === 'zona' && selectedTags.length > 0) {
      gamesList = gamesList.filter((game) =>
        selectedTags.every((tag) => game.tags.includes(tag))
      );
    }
    return gamesList;
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) setSelectedTags((prev) => [...prev, tag]);
    else setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const closeDetails = () => {
    setSelectedGame(null);
    setScreenshotIndex(0);
  };

  const nextScreenshot = () => {
    if (!selectedGame) return;
    setScreenshotIndex((prev) => (prev + 1) % selectedGame.screenshots.length);
  };

  const prevScreenshot = () => {
    if (!selectedGame) return;
    setScreenshotIndex((prev) =>
      prev === 0 ? selectedGame.screenshots.length - 1 : prev - 1
    );
  };

  // ✅ Новый универсальный обработчик для кнопок навигации
  const handleSectionChange = (section: 'zona' | 'arena') => {
    setCurrentSection(section);
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedGame(null);
    setScreenshotIndex(0);
  };

  return (
    <div className="app">
      <header className="header">
        <div
          onClick={() => window.location.reload()} // ✅ перезагрузка страницы
          style={{ cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="Лого" />
        </div>
        <button onClick={() => handleSectionChange('zona')}>VR-Зона</button>
        <button onClick={() => handleSectionChange('arena')}>VR-Арена</button>
        <button onClick={() => (window.location.href = 'http://192.168.93.254:5173/')}>
          Редактирование
        </button>
      </header>

      <div className="content">
        {currentSection === null && !selectedGame && (
          <div className="intro">
            <img src="/logo.png" alt="Лого" />
            <h1>Список игр VR для ознакомления</h1>
          </div>
        )}

        {currentSection && !selectedGame && (
          <div>
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            {currentSection === 'zona' && (
              <div className="tags-filter">
                <h3>Фильтр по тегам</h3>
                {getUniqueTags().map((tag) => (
                  <label key={tag}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={(e) => handleTagChange(tag, e.target.checked)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            )}

            <div className="games-grid">
              {filteredGames().map((game) => (
                <div key={game.name} className="game-card" onClick={() => setSelectedGame(game)}>
                  <img src={game.cardHeader} alt="Шапка" className="card-header" />
                  <h3>{game.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedGame && (
          <div className="game-page">
            <button className="close-btn" onClick={closeDetails}>
              ← Назад
            </button>
            <h2>{selectedGame.name}</h2>

            <img src={selectedGame.cardHeader} alt="Шапка" className="game-header" />
            <p className="description">{selectedGame.description}</p>

            {selectedGame.trailer && (
              <div className="video-container">
                <video
                  controls
                  src={selectedGame.trailer}
                  poster={selectedGame.mobileCardHeader || selectedGame.cardHeader}
                >
                  Ваш браузер не поддерживает встроенные видео.
                </video>
              </div>
            )}

            {selectedGame.screenshots.length > 0 && (
              <div className="screenshot-slider">
                <button className="arrow left" onClick={prevScreenshot}>
                  ❮
                </button>
                <img
                  src={selectedGame.screenshots[screenshotIndex]}
                  alt={`Скриншот ${screenshotIndex + 1}`}
                />
                <button className="arrow right" onClick={nextScreenshot}>
                  ❯
                </button>
                <div className="dots">
                  {selectedGame.screenshots.map((_, i) => (
                    <span
                      key={i}
                      className={`dot ${i === screenshotIndex ? 'active' : ''}`}
                      onClick={() => setScreenshotIndex(i)}
                    ></span>
                  ))}
                </div>
              </div>
            )}

            <div className="info-block">
              <p><strong>Русский язык:</strong> {selectedGame.russian}</p>
              <p><strong>Управление:</strong> {selectedGame.control.join(', ') || '—'}</p>
              <p><strong>Опасности:</strong> {selectedGame.violation.join(', ') || '—'}</p>
              <p><strong>Возраст:</strong> {selectedGame.age}</p>
              <p><strong>Сложность:</strong> {selectedGame.difficulty}</p>
              <p><strong>Теги:</strong> {selectedGame.tags.join(', ') || '—'}</p>
            </div>

            {'submodes' in selectedGame && selectedGame.submodes.length > 0 && (
              <div className="submodes-section">
                <h3>Подрежимы</h3>
                <div className="submodes-grid">
                  {selectedGame.submodes.map((submode, index) => (
                    <div key={index} className="submode-card">
                      {submode.header && (
                        <img src={submode.header} alt={submode.name} />
                      )}
                      <h4>{submode.name}</h4>
                      <p>{submode.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
