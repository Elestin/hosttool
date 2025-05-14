import React, { useState, useEffect, useRef } from 'react';

// Roles configuration
const rolesConfig = [
  { name: 'Villager', balance: 1, maxCount: Infinity },
  { name: 'Werewolf', balance: -6, maxCount: Infinity },
  { name: 'Seer', balance: 7, maxCount: 1 },
  { name: 'Apprentice Seer', balance: 4, maxCount: 1 },
  { name: 'Witch', balance: 4, maxCount: 1 },
  { name: 'Bodyguard', balance: 3, maxCount: 1 },
  { name: 'Hunter', balance: 3, maxCount: 1 },
  { name: 'Cupid', balance: -3, maxCount: 1 },
  { name: 'Diseased', balance: 3, maxCount: 1 },
  { name: 'Cursed', balance: -3, maxCount: 1 },
  { name: 'Lycan', balance: -1, maxCount: 1 },
  { name: 'Minion', balance: -6, maxCount: 1 },
  { name: 'Sorcerer', balance: -3, maxCount: 1 },
  { name: 'Wolf Cub', balance: -8, maxCount: 1 },
  { name: 'Prince', balance: 3, maxCount: 1 },
  { name: 'Martyr', balance: 3, maxCount: 1 },
  { name: 'Sasquatch', balance: -2, maxCount: 1 }
];
const repeatableRoles = ['Villager', 'Werewolf'];

export default function App() {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [nightCount, setNightCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
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

  // One-time flags
  const [usedGuard, setUsedGuard] = useState(false);
  const [usedHeal, setUsedHeal] = useState(false);
  const [usedPoison, setUsedPoison] = useState(false);

  const fileInputRef = useRef();

  // Derived
  const alivePlayers = players.filter(p => p.alive);
  const hasRole = role => players.some(p => p.role === role && p.alive);
  const countRole = role => players.filter(p => p.role === role).length;
  const availableRoles = rolesConfig.filter(r => repeatableRoles.includes(r.name) || countRole(r.name) < r.maxCount);

  // Undo history
  const pushHistory = () => setHistory(h => [...h, { players: JSON.parse(JSON.stringify(players)), logs: [...logs], nightCount, usedGuard, usedHeal, usedPoison, mayor }]);
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setPlayers(prev.players); setLogs(prev.logs); setNightCount(prev.nightCount);
    setUsedGuard(prev.usedGuard); setUsedHeal(prev.usedHeal); setUsedPoison(prev.usedPoison); setMayor(prev.mayor);
    setHistory(h => h.slice(0, -1));
  };

  // Save/Load
  useEffect(() => {
    const saved = localStorage.getItem('werewolfGame');
    if (saved) {
      const data = JSON.parse(saved);
      setPlayers(data.players || []); setLogs(data.logs || []);
      setNightCount(data.nightCount || 0);
      setUsedGuard(data.usedGuard); setUsedHeal(data.usedHeal); setUsedPoison(data.usedPoison);
      setMayor(data.mayor);
    }
  }, []);

  const saveGame = () => {
    const data = JSON.stringify({ players, logs, nightCount, usedGuard, usedHeal, usedPoison, mayor }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'werewolf_game.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const loadGame = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => {
      const d = JSON.parse(ev.target.result);
      setPlayers(d.players); setLogs(d.logs); setNightCount(d.nightCount);
      setUsedGuard(d.usedGuard); setUsedHeal(d.usedHeal); setUsedPoison(d.usedPoison);
      setMayor(d.mayor);
    }; reader.readAsText(file);
  };

  const addPlayer = () => {
    if (!nameInput || !roleInput) return;
    pushHistory(); setPlayers(ps => [...ps, { id: Date.now(), name: nameInput, role: roleInput, alive: true, lover: null }]);
    setNameInput(''); setRoleInput('');
  };
  const toggleDark = () => setDarkMode(dm => !dm);

  const resolveNight = () => {
    pushHistory(); let newLogs=[...logs], toKill=[];
    if (hasRole('Werewolf') && wolfTarget) { newLogs.push(`Werewolves killed ${players.find(p=>p.id==wolfTarget).name}`); toKill.push(+wolfTarget); }
    if (hasRole('Seer') && seerTarget) { const s=players.find(p=>p.id==seerTarget); newLogs.push(`Seer saw ${s.name} is ${s.role}`); }
    if (hasRole('Apprentice Seer') && apprTarget && !hasRole('Seer')) { newLogs.push(`Apprentice saw ${players.find(p=>p.id==apprTarget).name}`); }
    if (hasRole('Sorcerer') && sorcTarget) { newLogs.push(`Sorcerer hunts ${players.find(p=>p.id==sorcTarget).name}`); }
    if (hasRole('Bodyguard') && guardTarget && !usedGuard) { newLogs.push(`${players.find(p=>p.id==guardTarget).name} protected`); toKill=toKill.filter(id=>id!=guardTarget); setUsedGuard(true);}    
    if (hasRole('Witch')&&witchHeal&&!usedHeal&&toKill.length){newLogs.push('Witch healed');toKill=[];setUsedHeal(true);}    
    if (hasRole('Witch')&&witchPoison&&!usedPoison){newLogs.push(`Witch poisoned ${players.find(p=>p.id==witchPoison).name}`);toKill.push(+witchPoison);setUsedPoison(true);}    
    if (hasRole('Cupid')&&cupidOne&&cupidTwo){setPlayers(ps=>ps.map(p=>p.id==cupidOne?{...p,lover:+cupidTwo}:p.id==cupidTwo?{...p,lover:+cupidOne}:p));newLogs.push('Lovers linked');}
    let updated=players.map(p=>toKill.includes(p.id)?{...p,alive:false}:p);
    updated.forEach(p=>{if(!p.alive&&p.lover){let lf=updated.find(x=>x.id==p.lover);if(lf.alive){lf.alive=false;newLogs.push(`${lf.name} died of grief`);}}});
    setPlayers(updated);setLogs(newLogs);setNightCount(n=>n+1);
    setWolfTarget('');setSeerTarget('');setApprTarget('');setSorcTarget('');setGuardTarget('');setWitchHeal(false);setWitchPoison('');setCupidOne('');setCupidTwo('');
  };
  const resolveDay = () => {
    pushHistory(); let newLogs=[...logs];
    if(lynchTarget){const v=players.find(p=>p.id==lynchTarget);if(v.role=='Prince')newLogs.push(`${v.name} spared`);else if(v.role=='Martyr'){v.alive=false;newLogs.push(`${v.name} died`);}else{v.alive=false;newLogs.push(`${v.name} lynched`);}if(v.lover){let lf=players.find(p=>p.id==v.lover);if(lf.alive){lf.alive=false;newLogs.push(`${lf.name} died of grief`);}}}
    if(mayor) newLogs.push(`Mayor: ${players.find(p=>p.id==mayor).name}`);
    setPlayers([...players]);setLogs(newLogs);setLynchTarget('');setMayor('');
  };
  const calcWinPct=()=>{let pos=0,neg=0;alivePlayers.forEach(p=>{const b=rolesConfig.find(r=>r.name==p.role).balance;b>0?pos+=b:neg+=Math.abs(b);});return pos+neg?Math.round(pos/(pos+neg)*100):50;};

  return(
    <div className={darkMode?'dark':''}>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 grid grid-cols-[1fr,1fr] gap-6">
        {/* Left */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl dark:text-white">Add Player</h2>
            <div className="mt-2 flex space-x-2">
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Name" className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200" />
              <select value={roleInput} onChange={e=>setRoleInput(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Role</option>
                {availableRoles.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              <button onClick={addPlayer} className="bg-indigo-600 text-white px-4 py-2 rounded">Add</button>
            </div>
            <div className="mt-2 flex space-x-2">
              <button onClick={saveGame} className="px-4 py-2 border rounded">Save</button>
              <button onClick={()=>fileInputRef.current.click()} className="px-4 py-2 border rounded">Load</button>
              <input type="file" ref={fileInputRef} accept="application/json" onChange={loadGame} hidden />
              <button onClick={undo} className="px-4 py-2 border rounded">Undo</button>
              <button onClick={toggleDark} className="px-4 py-2 border rounded">{darkMode?'Light':'Dark'}</button>
            </div>
          </div>
          {/* Night Actions */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl dark:text-white">Night Actions</h2>
            <div className="mt-2 space-y-2">
              <select value={wolfTarget} onChange={e=>setWolfTarget(e.target.value)} disabled={!hasRole('Werewolf')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Werewolf kill</option>
                {alivePlayers.filter(p=>p.role!=='Werewolf').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={seerTarget} onChange={e=>setSeerTarget(e.target.value)} disabled={!hasRole('Seer')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Seer investigate</option>
                {alivePlayers.filter(p=>p.role!=='Seer').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={apprTarget} onChange={e=>setApprTarget(e.target.value)} disabled={!hasRole('Apprentice Seer')||hasRole('Seer')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Apprentice investigate</option>
                {alivePlayers.filter(p=>p.role!=='Apprentice Seer').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={sorcTarget} onChange={e=>setSorcTarget(e.target.value)} disabled={!hasRole('Sorcerer')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Sorcerer hunt</option>
                {alivePlayers.filter(p=>p.role!=='Sorcerer').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={guardTarget} onChange={e=>setGuardTarget(e.target.value)} disabled={!hasRole('Bodyguard')||usedGuard} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                <option value="">Bodyguard protect</option>
                {alivePlayers.filter(p=>p.role!=='Bodyguard').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex space-x-2">
                <button disabled={!hasRole('Witch')||usedHeal} onClick={()=>setWitchHeal(h=>!h)} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">Heal</button>
                <select value={witchPoison} onChange={e=>setWitchPoison(e.target.value)} disabled={!hasRole('Witch')||usedPoison} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Poison</option>
                  {alivePlayers.filter(p=>p.role!=='Witch').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex space-x-2">
                <select value={cupidOne} onChange={e=>setCupidOne(e.target.value)} disabled={!hasRole('Cupid')} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Cupid 1</option>
                  {alivePlayers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={cupidTwo} onChange={e=>setCupidTwo(e.target.value)} disabled={!hasRole('Cupid')} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Cupid 2</option>
                  {alivePlayers.filter(p=>p.id!=+cupidOne).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={resolveNight} className="mt-2 w-full bg-green-600 text-white p-2 rounded">Resolve Night</button>
            </div>
          </div>
          {/* Day Actions */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl dark:text-white">Day Actions</h2>
            <div className="mt-2 space-y-2">
              <div className="flex space-x-2">
                <select value={lynchTarget} onChange={e=>setLynchTarget(e.target.value)} disabled={!alivePlayers.length} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Lynch</option>
                  {alivePlayers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={resolveDay} className="bg-red-600 text-white px-4 py-2 rounded">Lynch</button>
              </div>
              <div className="flex space-x-2">
                <select value={mayor} onChange={e=>{setMayor(e.target.value); pushHistory();}} disabled={!alivePlayers.length} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Mayor</option>
                  {alivePlayers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={()=>{resolveDay(); setMayor(mayor);}} className="bg-blue-600 text-white px-4 py-2 rounded">Appoint</button>
              </div>
            </div>
          </div>
        </div>
        {/* Right column */}
        <div className="space-y-6">
          {/* Players list */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-48">
            <h2 className="text-xl dark:text-white">Players</h2>
            <ul className="mt-2 dark:text-gray-200">
              {players.map(p=><li key={p.id} className={p.alive?'':'opacity-50'}>{p.name}{p.id==mayor?' (Mayor)':''} ({p.role}){p.lover?' ❤️':''}</li>)}
            </ul>
          </div>
          {/* Game Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl dark:text-white">Game Summary</h2>
            <p className="dark:text-gray-200">Night #{nightCount}</p>
            <p className="dark:text-gray-200">Alive: {alivePlayers.length}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div className="h-full bg-green-400" style={{width:`${calcWinPct()}%`}} />
            </div>
          </div>
          {/* Game Log */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-48">
            <h2 className="text-xl dark:text-white">Game Log</h2>
            <ul className="mt-2 dark:text-gray-200">
              {logs.map((l,i)=><li key={i}>{l}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
