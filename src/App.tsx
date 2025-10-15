import React, { useState, useEffect } from 'react';
import './styles.scss';

// Определяем жанры и списки игр
const genresData: { [key: string]: string[] } = {
  'Шутеры': [
    'Arizona Sunshine Remake',
    'Arizona Sunshine 2',
    'BONEWORKS',
    'BONELAB',
    'Containment Initiative 2',
    'Crossfire: Sierra Squad',
    "Guns'n'Stories: Bulletproof VR",
    'Half-Life: Alyx',
    'Into the Radius',
    'Raw Data',
    'SUPERHOT VR',
  ],
  'Драки': [
    'GORN',
    'GORN 2',
    'Hellsplit: Arena',
    'Creed: Rise to Glory',
    'SWORDS Of GARGANTUA',
    'UNDERDOGS',
  ],
  'Детские': [
    'Beat Saber',
    'Angry Birds VR: Isle of Pigs',
    'Bugsnax',
    'The Wizards - Enhanced Edition',
    'Loco Dojo',
  ],
  'Выживание': [
    "No Man's Sky",
    'Elven Assassin',
    'Survival Nation',
    'The Forest',
  ],
  'Хоррор': [
    'Phasmophobia',
    "FIVE NIGHTS AT FREDDY'S: HELP WANTED",
  ],
  'Симуляторы': [
    'Job Simulator',
    'I Am Cat',
    'Maestro',
    'Walkabout Mini Golf VR',
    'Vacation Simulator',
    'Cooking Simulator',
  ],
  'Головоломки': [
    'Myst',
    'Moss',
    'Moss: Book II',
  ],
};

// Все игры в алфавитном порядке
const allGames = Object.values(genresData).flat().sort((a, b) => a.localeCompare(b));

interface GameData {
  id?: string;
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

const App: React.FC = () => {
  const [currentGenre, setCurrentGenre] = useState<string | null>(null);
  const [gamesData, setGamesData] = useState<GameData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data: GameData[]) => setGamesData(data))
      .catch((err) => {
        console.error('Error loading games:', err);
        setGamesData([]);
      });
  }, []);

  const getGameData = (name: string): GameData => {
    const existing = gamesData.find((g) => g.name === name);
    return (
      existing || {
        name,
        russian: 'Отсутствует',
        control: [],
        violation: [],
        age: 'Взрослые (18 и более лет)',
        difficulty: 1,
        tags: [],
        screenshots: [],
        description: '',
        trailer: '',
        cardHeader: '',
        mobileCardHeader: '',
      }
    );
  };

  const openModal = (gameName: string) => {
    setSelectedGame(gameName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // Проверка уникальности имени
  const isDuplicateName = (name: string, id?: string) => {
    return gamesData.some((g) => g.name === name && g.id !== id);
  };

  const handleSave = async (updatedData: GameData) => {
    if (isDuplicateName(updatedData.name, updatedData.id)) {
      alert('Ошибка: игра с таким названием уже существует!');
      return;
    }

    let newData: GameData[];
    if (updatedData.id) {
      const response = await fetch(`/api/games/${updatedData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const savedGame = await response.json();
      newData = gamesData.map((g) => (g.id === savedGame.id ? savedGame : g));
    } else {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const savedGame = await response.json();
      newData = [...gamesData, savedGame];
    }
    setGamesData(newData);
    closeModal();
  };

  const filteredGames = () => {
    let gamesList = currentGenre ? genresData[currentGenre] || [] : allGames;
    if (searchQuery) {
      gamesList = gamesList.filter((game) =>
        game.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return gamesList;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Список игр</h1>
        <input
          type="text"
          placeholder="Поиск по играм..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </header>

      <nav className="nav">
        <ul>
          {Object.keys(genresData).map((genre) => (
            <li key={genre}>
              <button onClick={() => setCurrentGenre(genre)}>{genre}</button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="content">
        <h2>{currentGenre || 'Все игры'}</h2>
        <table className="games-table">
          <thead>
            <tr>
              <th>Название игры</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames().map((game) => (
              <tr key={game}>
                <td onClick={() => openModal(game)} className="game-cell">
                  {game}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedGame && (
        <GameModal
          gameData={getGameData(selectedGame)}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      <a
        href="http://192.168.93.254:5174/"
        className="fab"
        title="Перейти на клиентский сайт"
      >
        →
      </a>
    </div>
  );
};

interface GameModalProps {
  gameData: GameData;
  onSave: (updatedData: GameData) => Promise<void>;
  onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ gameData, onSave, onClose }) => {
  const [russian, setRussian] = useState(gameData.russian);
  const [control, setControl] = useState<string[]>([]);
  const [isOtherControl, setIsOtherControl] = useState(false);
  const [otherControl, setOtherControl] = useState('');
  const [violation, setViolation] = useState<string[]>([]);
  const [isOtherViolation, setIsOtherViolation] = useState(false);
  const [otherViolation, setOtherViolation] = useState('');
  const [age, setAge] = useState(gameData.age);
  const [difficulty, setDifficulty] = useState(gameData.difficulty);
  const [tags, setTags] = useState(gameData.tags);
  const [screenshots, setScreenshots] = useState(gameData.screenshots);
  const [description, setDescription] = useState(gameData.description);
  const [trailer, setTrailer] = useState(gameData.trailer);
  const [cardHeader, setCardHeader] = useState(gameData.cardHeader);
  const [mobileCardHeader, setMobileCardHeader] = useState(gameData.mobileCardHeader);

  const fixedControls = ['Сидя', 'Стоя', 'Телепорт', 'Отклонение стиков'];
  const fixedViolations = [
    'Жестокость',
    'Много крови',
    'Взрослый юмор',
    'Распитие алкогольных напитков',
    'Курение',
    'Ненормативная лексика',
  ];

  useEffect(() => {
    const initialControl = gameData.control.filter((c) => fixedControls.includes(c));
    const initialOtherControl = gameData.control.filter((c) => !fixedControls.includes(c)).join(', ');

    setControl(initialControl);
    setOtherControl(initialOtherControl);
    setIsOtherControl(!!initialOtherControl);

    const initialViolation = gameData.violation.filter((v) => fixedViolations.includes(v));
    const initialOtherViolation = gameData.violation.filter((v) => !fixedViolations.includes(v)).join(', ');

    setViolation(initialViolation);
    setOtherViolation(initialOtherViolation);
    setIsOtherViolation(!!initialOtherViolation);
  }, [gameData]);

  const handleSaveClick = async () => {
    let finalControl = control;
    if (isOtherControl && otherControl.trim()) {
      finalControl = [...finalControl, ...otherControl.trim().split(',').map((s) => s.trim()).filter(Boolean)];
    }

    let finalViolation = violation;
    if (isOtherViolation && otherViolation.trim()) {
      finalViolation = [...finalViolation, ...otherViolation.trim().split(',').map((s) => s.trim()).filter(Boolean)];
    }

    await onSave({
      id: gameData.id,
      name: gameData.name,
      russian,
      control: finalControl,
      violation: finalViolation,
      age,
      difficulty,
      tags,
      screenshots,
      description,
      trailer,
      cardHeader,
      mobileCardHeader,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Редактирование: {gameData.name}</h2>

        <div className="section">
          <h3>Наличие русского языка</h3>
          {['Присутствует', 'Отсутствует', 'Есть субтитры'].map((opt) => (
            <label key={opt}>
              <input type="radio" checked={russian === opt} onChange={() => setRussian(opt as any)} />
              {opt}
            </label>
          ))}
        </div>

        <div className="section">
          <h3>Способы игры</h3>
          {fixedControls.map((opt) => (
            <label key={opt}>
              <input
                type="checkbox"
                checked={control.includes(opt)}
                onChange={(e) => setControl((prev) =>
                  e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt)
                )}
              />
              {opt}
            </label>
          ))}
          <label>
            <input type="checkbox" checked={isOtherControl} onChange={(e) => setIsOtherControl(e.target.checked)} />
            Иной способ
          </label>
          {isOtherControl && (
            <input
              type="text"
              placeholder="Укажите иной способ"
              value={otherControl}
              onChange={(e) => setOtherControl(e.target.value)}
              className="text-input"
            />
          )}
        </div>

        <div className="section">
          <h3>Опасности</h3>
          {fixedViolations.map((opt) => (
            <label key={opt}>
              <input
                type="checkbox"
                checked={violation.includes(opt)}
                onChange={(e) => setViolation((prev) =>
                  e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt)
                )}
              />
              {opt}
            </label>
          ))}
          <label>
            <input type="checkbox" checked={isOtherViolation} onChange={(e) => setIsOtherViolation(e.target.checked)} />
            Иное
          </label>
          {isOtherViolation && (
            <input
              type="text"
              placeholder="Укажите иное"
              value={otherViolation}
              onChange={(e) => setOtherViolation(e.target.value)}
              className="text-input"
            />
          )}
        </div>

        <div className="section">
          <h3>Возрастная категория</h3>
          {['Дети (6-12 лет)', 'Подростки (12-16 лет)', 'Юноши (16-18 лет)', 'Взрослые (18 и более лет)'].map((opt) => (
            <label key={opt}>
              <input type="radio" checked={age === opt} onChange={() => setAge(opt as any)} />
              {opt}
            </label>
          ))}
        </div>

        <div className="section">
          <h3>Сложность управления</h3>
          {[1, 2, 3, 4, 5].map((num) => (
            <label key={num}>
              <input type="radio" checked={difficulty === num} onChange={() => setDifficulty(num as any)} />
              {num}
            </label>
          ))}
        </div>

        <div className="modal-buttons">
          <button onClick={handleSaveClick}>Сохранить</button>
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default App;
