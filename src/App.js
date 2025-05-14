import React, { useState, useEffect, useRef } from 'react';

// Roles configuration
const rolesConfig = [
  { name: 'Villager', balance: 1, maxCount: Infinity },
  { name: 'Werewolf', balance: -6, maxCount: Infinity },
  { name: 'Seer', balance: 7, maxCount: 1 },
  { name: 'Apprentice Seer', balance: 4, maxCount: 1 },
  { name: 'Cupid', balance: -3, maxCount: 1 },
  { name: 'Witch', balance: 4, maxCount: 1 },
  { name: 'Hunter', balance: 3, maxCount: 1 },
  { name: 'Cursed', balance: -3, maxCount: 1 },
  { name: 'Diseased', balance: 3, maxCount: 1 },
  { name: 'Lycan', balance: -1, maxCount: 1 },
  { name: 'Minion', balance: -6, maxCount: 1 },
  { name: 'Sorcerer', balance: -3, maxCount: 1 },
  { name: 'Wolf Cub', balance: -8, maxCount: 1 },
  { name: 'Prince', balance: 3, maxCount: 1 },
  { name: 'Martyr', balance: 3, maxCount: 1 },
  { name: 'Sasquatch', balance: -2, maxCount: 1 }
];
const repeatableRoles = ['Villager', 'Werewolf'];

function App() {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [nightCount, setNightCount] = useState(0);
  const [theme, setTheme] = useState('light');
  const [history, setHistory] = useState([]);

  // Inputs
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [wolfTarget, setWolfTarget] = useState('');
  const [seerTarget, setSeerTarget] = useState('');
  const [apprTarget, setApprTarget] = useState('');
  const [sorcTarget, setSorcTarget] = useState('');
  const [guardTarget, setGuardTarget] = useState('');
  const [witchHeal, setWitchHeal] = useState(false);
  const [witchPoison, setWitchPoison] = useState('');
  const [cupidOne, setCupidOne] = useState('');
  const [cupidTwo, setCupidTwo] = useState('');
  const [lynchTarget, setLynchTarget] = useState('');
  const [mayor, setMayor] = useState('');
  const [usedGuard, setUsedGuard] = useState(false);
  const [usedHeal, setUsedHeal] = useState(false);
  const [usedPoison, setUsedPoison] = useState(false);

  const fileRef = useRef();

  // Derived
  const alive = players.filter(p => p.alive);
  const has = role => alive.some(p => p.role === role);
  const countRole = role => players.filter(p => p.role === role).length;
  const availableRoles = rolesConfig.filter(r => repeatableRoles.includes(r.name) || countRole(r.name) < r.maxCount);

  // History & Undo
  const pushHistory = () => {
    setHistory(h => [...h, {
      players: JSON.parse(JSON.stringify(players)),
      logs: [...logs],
      nightCount,
      usedGuard,
      usedHeal,
      usedPoison,
      mayor
    }]);
  };
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setPlayers(prev.players);
    setLogs(prev.logs);
    setNightCount(prev.nightCount);
    setUsedGuard(prev.usedGuard);
    setUsedHeal(prev.usedHeal);
    setUsedPoison(prev.usedPoison);
    setMayor(prev.mayor);
    setHistory(h => h.slice(0, -1));
  };

  // Save/Load
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('werewolfGame') || '{}');
    if (data.players) {
      setPlayers(data.players);
      setLogs(data.logs);
      setNightCount(data.nightCount);
      setUsedGuard(data.usedGuard);
      setUsedHeal(data.usedHeal);
      setUsedPoison(data.usedPoison);
      setMayor(data.mayor);
    }
  }, []);
  const saveGame = () => {
    localStorage.setItem('werewolfGame', JSON.stringify({ players, logs, nightCount, usedGuard, usedHeal, usedPoison, mayor }));
    alert('Game saved');
  };
  const downloadGame = () => {
    const blob = new Blob([JSON.stringify({ players, logs, nightCount, usedGuard, usedHeal, usedPoison, mayor }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'werewolf_game.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const loadGame = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => {
      const d = JSON.parse(ev.target.result);
      setPlayers(d.players);
      setLogs(d.logs);
      setNightCount(d.nightCount);
      setUsedGuard(d.usedGuard);
      setUsedHeal(d.usedHeal);
      setUsedPoison(d.usedPoison);
      setMayor(d.mayor);
    }; reader.readAsText(file);
  };

  // Actions
  const addPlayer = () => {
    if (!nameInput.trim() || !roleInput) return;
    pushHistory();
    setPlayers(ps => [...ps, { id: Date.now(), name: nameInput.trim(), role: roleInput, alive: true, lover: null }]);
    setNameInput('');
    setRoleInput('');
  };
  const resolveNight = () => { /* full logic omitted for brevity */ };
  const resolveDay = () => { /* full logic omitted for brevity */ };
  const calcWinPct = () => 50; // simplified

  const themeClasses = { light: 'bg-white text-black', dark: 'bg-black text-white', solarized: 'bg-blue-100 text-blue-900' };

  return (
    <div className={`${themeClasses[theme]} min-h-screen p-6`}>
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl">Add Player</h2>
            <div className="mt-2 flex space-x-2">
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Name" className="flex-1 p-2 border rounded" />
              <select value={roleInput} onChange={e=>setRoleInput(e.target.value)} className="p-2 border rounded">
                <option value="">Role</option>
                {availableRoles.map(r=> <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              <button onClick={addPlayer} className="bg-indigo-600 text-white px-4 py-2 rounded">Add</button>
            </div>
            <div className="mt-2 flex space-x-2">
              <select value={theme} onChange={e=>setTheme(e.target.value)} className="p-2 border rounded">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="solarized">Solarized</option>
              </select>
              <button onClick={saveGame} className="px-4 py-2 border rounded">Save</button>
              <button onClick={()=>fileRef.current.click()} className="px-4 py-2 border rounded">Load</button>
              <input type="file" ref={fileRef} accept="application/json" onChange={loadGame} hidden />
              <button onClick={undo} className="px-4 py-2 border rounded">Undo</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl">Night Actions</h2>
            {/* Select inputs for each role go here */}
            <button onClick={resolveNight} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Resolve Night</button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl">Day Actions</h2>
            {/* Select inputs for lynch and mayor */}
            <button onClick={resolveDay} className="mt-2 bg-red-600 text-white px-4 py-2 rounded">Resolve Day</button>
          </div>
        </div>
        {/* Right column: Players, Summary, Log */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-48">
            <h2 className="text-xl">Players</h2>
            <ul>
              {players.map(p=> <li key={p.id}>{p.name}{p.id==mayor?' (Mayor)':''} ({p.role}){p.lover?' ❤️':''}</li>)}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl">Game Summary</h2>
            <p>Night {nightCount}</p>
            <p>Alive: {alive.length}</p>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden"><div className="h-full bg-green-500" style={{width:`${calcWinPct()}%`}}/></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-48">
            <h2 className="text-xl">Game Log</h2>
            <ul>
              {logs.map((l,i)=> <li key={i}>{l}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
