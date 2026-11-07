/**
 * Multiplayer Hub Modal for Madness Combat: No Context
 * Features:
 * 1. Player profile customization (name & Grumt profile picture selection)
 * 2. Server browsing and direct-code joining
 * 3. Server creation (custom name, map, mode, player limit)
 * 4. Waiting room / server lobby with host-exclusive kick player & start match controls
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Play, 
  Shield, 
  UserMinus, 
  Copy, 
  Check, 
  Radio, 
  RefreshCw, 
  Zap, 
  Crown, 
  Globe, 
  Flame, 
  AlertCircle,
  Dice5,
  LogIn
} from 'lucide-react';
import { 
  GruntAvatarId, 
  MultiplayerServer, 
  PlayerProfile, 
  MultiplayerMapId, 
  MultiplayerModeId 
} from '../types/multiplayer';
import { GRUNT_AVATARS } from '../utils/gruntAvatars';
import { GruntAvatarIcon } from './GruntAvatarIcon';
import { multiplayerService, MultiplayerEvent } from '../services/multiplayerService';
import { soundManager } from '../audio/soundManager';

interface MultiplayerModalProps {
  onClose: () => void;
  onLaunchMatch: (server: MultiplayerServer) => void;
}

type TabType = 'SERVERS' | 'CREATE' | 'PROFILE';

const RANDOM_NAMES = [
  'Hank Wimbleton',
  'Sanford',
  'Deimos',
  'Tricky The Clown',
  'Dr. Hofnarr',
  'Jebus (Christoff)',
  'The Auditor',
  'Agency Grunt 042',
  'A.A.H.W. Sweeper',
  'Sheriff of Nevada',
  'Madness Slayer',
  'Nevada Outlaw',
];

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  onClose,
  onLaunchMatch,
}) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => multiplayerService.getProfile());
  const [servers, setServers] = useState<MultiplayerServer[]>(() => multiplayerService.getServers());
  const [activeServer, setActiveServer] = useState<MultiplayerServer | null>(() => multiplayerService.getCurrentServer());
  
  const [activeTab, setActiveTab] = useState<TabType>('SERVERS');
  const [copiedCode, setCopiedCode] = useState(false);
  const [directCode, setDirectCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Server creation state
  const [newServerName, setNewServerName] = useState(`${profile.name}'s Carnage`);
  const [newMap, setNewMap] = useState<MultiplayerMapId>('arena');
  const [newMode, setNewMode] = useState<MultiplayerModeId>('deathmatch');
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(4);

  // Profile edit state
  const [nameInput, setNameInput] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState<GruntAvatarId>(profile.avatar);

  // Subscribe to real-time events across windows / tabs
  useEffect(() => {
    const unsubscribe = multiplayerService.subscribe((event: MultiplayerEvent) => {
      if (event.type === 'SERVER_LIST_UPDATED') {
        setServers([...event.servers]);
        const current = multiplayerService.getCurrentServer();
        setActiveServer(current ? { ...current } : null);
      } else if (event.type === 'PLAYER_JOINED' || event.type === 'PLAYER_LEFT') {
        const current = multiplayerService.getCurrentServer();
        setActiveServer(current ? { ...current } : null);
      } else if (event.type === 'PLAYER_KICKED') {
        if (event.playerId === profile.id) {
          setActiveServer(null);
          setStatusMessage({
            text: `You were kicked from the server by ${event.kickerName}.`,
            type: 'error',
          });
          soundManager.playPunch();
        } else {
          const current = multiplayerService.getCurrentServer();
          setActiveServer(current ? { ...current } : null);
        }
      } else if (event.type === 'MATCH_STARTED') {
        const current = multiplayerService.getCurrentServer();
        if (current && current.id === event.serverId) {
          soundManager.playIntroHit();
          onLaunchMatch(current);
        }
      }
    });

    return () => unsubscribe();
  }, [profile.id, onLaunchMatch]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Handle Profile Save
  const handleSaveProfile = () => {
    const updated = multiplayerService.updateProfile(nameInput, selectedAvatar);
    setProfile(updated);
    showToast('Grumt profile updated successfully!', 'success');
    soundManager.playPistol();
    setActiveTab('SERVERS');
  };

  const handleRandomizeName = () => {
    const chosen = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setNameInput(chosen);
    soundManager.playCasingPing();
  };

  // Handle Server Creation
  const handleCreateServer = () => {
    soundManager.playPistol();
    const created = multiplayerService.createServer(newServerName, newMap, newMode, newMaxPlayers);
    setActiveServer(created);
    showToast(`Server "${created.name}" created! You are the host.`, 'success');
  };

  // Handle Joining Server
  const handleJoinServer = (serverIdOrCode: string) => {
    soundManager.playPistol();
    const res = multiplayerService.joinServer(serverIdOrCode);
    if (res.success && res.server) {
      setActiveServer(res.server);
      showToast(`Joined server: ${res.server.name}`, 'success');
    } else {
      showToast(res.error || 'Failed to join server', 'error');
      soundManager.playDryFire();
    }
  };

  // Handle Leave Server
  const handleLeaveServer = () => {
    soundManager.playPistol();
    multiplayerService.leaveServer();
    setActiveServer(null);
    showToast('Left server lobby.', 'success');
  };

  // Host Kick Player
  const handleKickPlayer = (targetPlayerId: string, targetName: string) => {
    if (!activeServer) return;
    soundManager.playPunch();
    const success = multiplayerService.kickPlayer(activeServer.id, targetPlayerId);
    if (success) {
      showToast(`Kicked "${targetName}" from the server.`, 'success');
    }
  };

  // Host Start Match
  const handleStartMatch = () => {
    if (!activeServer) return;
    soundManager.playIntroHit();
    const success = multiplayerService.startMatch(activeServer.id);
    if (success) {
      onLaunchMatch(activeServer);
    }
  };

  const handleCopyCode = () => {
    if (!activeServer) return;
    navigator.clipboard.writeText(activeServer.code);
    setCopiedCode(true);
    soundManager.playCasingPing();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isLocalHost = activeServer && activeServer.hostId === profile.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#181a24] to-[#0d0f15] border-2 border-red-600 rounded-md shadow-[0_0_60px_rgba(220,38,38,0.35)] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 bg-[#12141c] border-b border-red-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-950 border border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                  MULTIPLAYER SQUADRONS
                </h2>
                <span className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-400 font-mono-tech text-[10px] font-bold rounded">
                  ONLINE LOBBY
                </span>
              </div>
              <p className="font-mono-tech text-xs text-slate-400">
                HOST OR JOIN NEVADA COMBAT SERVERS · CUSTOM GRUMT PROFILES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Profile Summary Badge */}
            <button
              onClick={() => {
                setActiveTab('PROFILE');
                setNameInput(profile.name);
                setSelectedAvatar(profile.avatar);
              }}
              title="Click to edit your name or Grumt avatar"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1a1e28] hover:bg-[#252b3a] border border-slate-700 hover:border-red-500/80 rounded transition cursor-pointer"
            >
              <GruntAvatarIcon avatarId={profile.avatar} size={28} />
              <div className="text-left font-mono-tech leading-tight">
                <span className="block text-xs font-bold text-white">{profile.name}</span>
                <span className="block text-[10px] text-red-400">EDIT PROFILE</span>
              </div>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className={`px-4 py-2 font-mono-tech text-xs flex items-center justify-center gap-2 border-b animate-in fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
              : 'bg-red-950/90 border-red-700 text-red-300'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Main Content Area: LOBBY vs BROWSER */}
        {activeServer ? (
          /* ======================================================== */
          /* ACTIVE SERVER LOBBY / WAITING ROOM */
          /* ======================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Server Details Card */}
              <div className="p-4 bg-[#141722] border border-red-700/60 rounded-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="font-heading text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                      {activeServer.name}
                    </span>
                    {isLocalHost && (
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono-tech font-bold rounded flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>YOU ARE HOST</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono-tech text-xs text-slate-300">
                    <span className="text-red-400 font-bold uppercase">
                      MAP: {activeServer.map.toUpperCase()}
                    </span>
                    <span>·</span>
                    <span className="text-amber-400 font-bold uppercase">
                      MODE: {activeServer.gameMode.toUpperCase()}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400">
                      PLAYERS: {activeServer.players.length} / {activeServer.maxPlayers}
                    </span>
                  </div>
                </div>

                {/* Server Code Sharing Badge */}
                <div className="flex items-center gap-2 bg-[#0d0f14] border border-slate-700 px-3 py-2 rounded">
                  <span className="text-xs font-mono-tech text-slate-400">SERVER CODE:</span>
                  <span className="font-mono-tech text-base font-black text-white tracking-widest">
                    {activeServer.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    title="Copy server code to share"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Connected Players Roster */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <span>CONNECTED SQUAD ({activeServer.players.length}/{activeServer.maxPlayers})</span>
                  </h3>
                  {isLocalHost && (
                    <span className="font-mono-tech text-[11px] text-amber-400">
                      ★ Host Controls: You can kick disruptive players or launch the match
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeServer.players.map((p) => {
                    const isSelf = p.id === profile.id;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded border flex items-center justify-between gap-3 transition-all ${
                          p.isHost 
                            ? 'bg-[#1a1824] border-amber-600/60 shadow-md' 
                            : 'bg-[#13161f] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GruntAvatarIcon avatarId={p.avatar} size={46} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading text-base font-bold text-white tracking-wide">
                                {p.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-mono-tech px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-700 rounded">
                                  YOU
                                </span>
                              )}
                              {p.isHost && (
                                <span className="text-[10px] font-mono-tech px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-600 rounded flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                                  <span>HOST</span>
                                </span>
                              )}
                            </div>
                            <div className="font-mono-tech text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-emerald-400">READY</span>
                              <span>·</span>
                              <span>{p.ping || 24}ms ping</span>
                            </div>
                          </div>
                        </div>

                        {/* KICK BUTTON: ONLY AVAILABLE TO SERVER HOST */}
                        {isLocalHost && !isSelf && (
                          <button
                            onClick={() => handleKickPlayer(p.id, p.name)}
                            title={`Kick ${p.name} from the server`}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-mono-tech font-bold rounded shadow transition cursor-pointer"
                          >
                            <UserMinus className="w-3.5 h-3.5 text-red-400" />
                            <span>KICK</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive In-Lobby Grumt Avatar Switcher */}
              <div className="mt-4 p-3 bg-[#11131a] border border-slate-800 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="font-heading text-xs font-bold text-slate-200 uppercase tracking-wider">
                      CHOOSE YOUR PLAYABLE "GRUMT" AVATAR
                    </span>
                  </div>
                  <span className="font-mono-tech text-[10px] text-red-400 uppercase font-bold">
                    SELECTED: {GRUNT_AVATARS.find((g) => g.id === profile.avatar)?.name || 'GRUNT'}
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {GRUNT_AVATARS.map((av) => {
                    const isSelected = profile.avatar === av.id;
                    return (
                      <button
                        key={av.id}
                        onClick={() => {
                          soundManager.playPistol();
                          const updated = multiplayerService.updateProfile(profile.name, av.id);
                          setProfile(updated);
                          showToast(`Playable Grumt changed to: ${av.name}`, 'success');
                        }}
                        title={`${av.name} (${av.tagline})`}
                        className={`flex flex-col items-center p-1.5 rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950 border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.7)] scale-105'
                            : 'bg-[#181a22] border-slate-800 hover:border-slate-600 hover:scale-102'
                        }`}
                      >
                        <GruntAvatarIcon avatarId={av.id} size={36} />
                        <span className="mt-1 font-mono-tech text-[9px] text-center text-slate-300 truncate w-full">
                          {av.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions: Leave vs Start Match */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleLeaveServer}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#161820] hover:bg-[#202430] border border-slate-700 text-slate-300 hover:text-white font-mono-tech text-xs uppercase tracking-wider rounded transition cursor-pointer"
              >
                LEAVE SERVER
              </button>

              <div className="w-full sm:w-auto flex items-center gap-3">
                {isLocalHost ? (
                  <button
                    onClick={handleStartMatch}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-heading text-lg font-black uppercase tracking-wider rounded-md shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>START MATCH</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#12141a] border border-amber-500/40 rounded text-amber-300 font-mono-tech text-xs uppercase animate-pulse">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>WAITING FOR HOST TO START MATCH...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* SERVER BROWSER & PROFILE TABS */
          /* ======================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-3 bg-[#13151c] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('SERVERS');
                    soundManager.playPistol();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 font-heading text-sm font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    activeTab === 'SERVERS'
                      ? 'border-red-500 text-red-400 bg-red-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>BROWSE SERVERS</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('CREATE');
                    soundManager.playPistol();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 font-heading text-sm font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    activeTab === 'CREATE'
                      ? 'border-red-500 text-red-400 bg-red-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>CREATE SERVER</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('PROFILE');
                    setNameInput(profile.name);
                    setSelectedAvatar(profile.avatar);
                    soundManager.playPistol();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 font-heading text-sm font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    activeTab === 'PROFILE'
                      ? 'border-red-500 text-red-400 bg-red-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>GRUMT PROFILE</span>
                </button>
              </div>

              {/* Direct Server Code Quick Input */}
              {activeTab === 'SERVERS' && (
                <div className="hidden sm:flex items-center gap-2 pb-1.5">
                  <input
                    type="text"
                    value={directCode}
                    onChange={(e) => setDirectCode(e.target.value)}
                    placeholder="ENTER CODE (e.g. NEV-1234)"
                    className="bg-[#0f1118] border border-slate-700 px-2.5 py-1 rounded text-xs font-mono-tech text-white uppercase placeholder:text-slate-500 focus:border-red-500 focus:outline-none w-52"
                  />
                  <button
                    onClick={() => handleJoinServer(directCode)}
                    disabled={!directCode.trim()}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono-tech text-xs font-bold uppercase rounded transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>CONNECT</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tab 1: Server Browser */}
            {activeTab === 'SERVERS' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {/* Mobile direct code join */}
                <div className="sm:hidden flex items-center gap-2 p-2 bg-[#14161f] border border-slate-800 rounded">
                  <input
                    type="text"
                    value={directCode}
                    onChange={(e) => setDirectCode(e.target.value)}
                    placeholder="ENTER SERVER CODE"
                    className="flex-1 bg-[#0f1118] border border-slate-700 px-2 py-1.5 rounded text-xs font-mono-tech text-white uppercase focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleJoinServer(directCode)}
                    disabled={!directCode.trim()}
                    className="px-3 py-1.5 bg-red-600 text-white font-mono-tech text-xs font-bold uppercase rounded cursor-pointer"
                  >
                    JOIN
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400">
                  <span>ACTIVE NEVADA SERVERS ({servers.length})</span>
                  <button
                    onClick={() => {
                      setServers(multiplayerService.getServers());
                      soundManager.playCasingPing();
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>REFRESH</span>
                  </button>
                </div>

                {servers.length === 0 ? (
                  <div className="text-center py-10 px-6 bg-[#11131a] border border-slate-800 rounded-md flex flex-col items-center justify-center space-y-3">
                    <Globe className="w-10 h-10 text-red-500/60 animate-pulse" />
                    <div>
                      <h4 className="font-heading text-lg font-bold text-white uppercase tracking-wider">
                        NO ACTIVE REAL-PLAYER SERVERS YET
                      </h4>
                      <p className="font-mono-tech text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        There are zero bots here! Be the first to create a server and invite other real players to fight in real-time Nevada combat.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setActiveTab('CREATE');
                          soundManager.playPistol();
                        }}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-heading text-xs font-bold uppercase tracking-wider rounded shadow transition cursor-pointer"
                      >
                        + CREATE FIRST SERVER
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Game link copied! Open in another tab or send to friends.', 'success');
                          soundManager.playCasingPing();
                        }}
                        className="px-4 py-2.5 bg-[#1a1d26] hover:bg-[#252a37] border border-slate-700 text-slate-300 hover:text-white font-mono-tech text-xs uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>COPY LINK FOR REAL PLAYERS</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  servers.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 bg-[#141722] hover:bg-[#191d2b] border border-slate-800 hover:border-red-600/70 rounded-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                            {s.name}
                          </h4>
                          <span className="font-mono-tech text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded uppercase">
                            CODE: {s.code}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tech text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>HOST: {s.hostName}</span>
                          </span>
                          <span>·</span>
                          <span className="text-red-400 font-bold uppercase">MAP: {s.map}</span>
                          <span>·</span>
                          <span className="text-amber-400 uppercase">MODE: {s.gameMode}</span>
                          <span>·</span>
                          <span className="text-emerald-400">
                            PLAYERS: {s.players.length}/{s.maxPlayers}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinServer(s.id)}
                        disabled={s.players.length >= s.maxPlayers}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-heading text-sm font-bold uppercase tracking-wider rounded shadow transition cursor-pointer"
                      >
                        {s.players.length >= s.maxPlayers ? 'SERVER FULL' : 'JOIN SERVER'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Create Server */}
            {activeTab === 'CREATE' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
                <div>
                  <label className="block font-heading text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                    SERVER NAME
                  </label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    maxLength={24}
                    placeholder="Enter server name..."
                    className="w-full bg-[#12141c] border border-slate-700 px-3.5 py-2.5 rounded font-heading text-base font-bold text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Map Selector */}
                  <div>
                    <label className="block font-heading text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                      COMBAT ARENA MAP
                    </label>
                    <select
                      value={newMap}
                      onChange={(e) => setNewMap(e.target.value as MultiplayerMapId)}
                      className="w-full bg-[#12141c] border border-slate-700 px-3.5 py-2.5 rounded font-mono-tech text-xs text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="arena">Tactical Arena Grid (Standard)</option>
                      <option value="field_tree">Chapter 1: The Field & Boombox Tree</option>
                      <option value="desert_sun">Chapter 2: Red Sun Nevada Desert</option>
                      <option value="bunker">Chapter 3: A.A.H.W. Bunker Core</option>
                      <option value="club_m">Chapter 4: Club M Nightclub</option>
                    </select>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block font-heading text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                      MATCH GAME MODE
                    </label>
                    <select
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value as MultiplayerModeId)}
                      className="w-full bg-[#12141c] border border-slate-700 px-3.5 py-2.5 rounded font-mono-tech text-xs text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="deathmatch">Free-For-All Grunt Deathmatch</option>
                      <option value="coop_survival">Co-op Squad Survival</option>
                      <option value="story_rush">Nevada Grunt Rush</option>
                    </select>
                  </div>
                </div>

                {/* Max Players */}
                <div>
                  <label className="block font-heading text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                    MAX PLAYERS LIMIT
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 6, 8].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNewMaxPlayers(count)}
                        className={`py-2 rounded font-heading text-sm font-bold uppercase transition cursor-pointer border ${
                          newMaxPlayers === count
                            ? 'bg-red-950 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                            : 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {count} PLAYERS
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateServer}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-heading text-lg font-black uppercase tracking-wider rounded-md shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all cursor-pointer"
                  >
                    <Crown className="w-5 h-5 text-amber-300" />
                    <span>CREATE SERVER (YOU ARE HOST)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Grumt Profile & Avatar Customizer */}
            {activeTab === 'PROFILE' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Name Customization */}
                <div className="bg-[#141722] p-4 rounded-md border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-heading text-xs font-bold text-red-400 uppercase tracking-wider">
                      SET YOUR OPERATIVE NAME
                    </label>
                    <button
                      onClick={handleRandomizeName}
                      className="flex items-center gap-1 text-[11px] font-mono-tech text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      <Dice5 className="w-3.5 h-3.5" />
                      <span>RANDOMIZE</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={18}
                      placeholder="Enter your name..."
                      className="flex-1 bg-[#0f1118] border border-slate-700 px-3.5 py-2.5 rounded font-heading text-lg font-bold text-white focus:border-red-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-heading text-sm font-bold uppercase tracking-wider rounded transition cursor-pointer"
                    >
                      SAVE PROFILE
                    </button>
                  </div>
                </div>

                {/* Profile Picture: Choose from Various "Grumts" */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>SELECT YOUR "GRUMT" PROFILE PICTURE</span>
                    </h3>
                    <span className="font-mono-tech text-xs text-slate-400">
                      {GRUNT_AVATARS.length} AUTHENTIC MADNESS COMBAT SKINS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {GRUNT_AVATARS.map((avatar) => {
                      const isSelected = selectedAvatar === avatar.id;

                      return (
                        <div
                          key={avatar.id}
                          onClick={() => {
                            setSelectedAvatar(avatar.id);
                            soundManager.playPistol();
                          }}
                          className={`p-3 rounded-md border flex flex-col items-center text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/80 shadow-[0_0_18px_rgba(220,38,38,0.5)] scale-[1.03]'
                              : 'bg-[#12141c] border-slate-800 hover:border-slate-600 hover:bg-[#161a24]'
                          }`}
                        >
                          <GruntAvatarIcon avatarId={avatar.id} size={54} />

                          <span className="font-heading text-xs font-bold text-white uppercase tracking-wide mt-2 line-clamp-1">
                            {avatar.name}
                          </span>

                          <span className="font-mono-tech text-[9px] text-red-400 uppercase mt-0.5">
                            {avatar.tier}
                          </span>

                          <p className="font-sans text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                            {avatar.tagline}
                          </p>

                          {isSelected && (
                            <span className="mt-2 text-[10px] font-mono-tech font-bold text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>SELECTED</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#0c0e13] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono-tech text-slate-400">
          <span>MADNESS COMBAT: NO CONTEXT · REAL-TIME MULTIPLAYER PROTOCOL</span>
          <span>CURRENT GRUMT: {profile.name}</span>
        </div>

      </div>
    </div>
  );
};
