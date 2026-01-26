import React, { useState } from 'react';

// Sample data
const competition = {
  name: "Prediction Pals 2026",
  type: "private",
  memberCount: 6,
  createdBy: "You",
};

const stats = {
  toForecast: 4,
  closed: 3,
  resolved: 12,
};

const upcomingProps = [
  {
    id: 1,
    title: "Bitcoin exceeds $150,000 at any point in 2026",
    deadline: "2026-02-01T23:59:00",
    yourForecast: null,
  },
  {
    id: 2,
    title: "The US Federal Reserve raises interest rates at least once in 2026",
    deadline: "2026-02-15T23:59:00",
    yourForecast: 0.20,
  },
  {
    id: 3,
    title: "A major US airline declares bankruptcy",
    deadline: "2026-02-28T23:59:00",
    yourForecast: null,
  },
  {
    id: 4,
    title: "Apple releases a foldable device",
    deadline: "2026-03-15T23:59:00",
    yourForecast: 0.35,
  },
];

const leaderboard = [
  { rank: 1, name: "Sarah Chen", avgBrier: 0.142, propsScored: 12 },
  { rank: 2, name: "You", avgBrier: 0.168, propsScored: 12, isYou: true },
  { rank: 3, name: "Marcus Webb", avgBrier: 0.195, propsScored: 11 },
  { rank: 4, name: "Aisha Patel", avgBrier: 0.211, propsScored: 12 },
  { rank: 5, name: "Jordan Lee", avgBrier: 0.234, propsScored: 10 },
  { rank: 6, name: "Chris Murphy", avgBrier: 0.267, propsScored: 9 },
];

// Helper to format deadline
const formatDeadline = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  const formatted = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
  
  if (diffDays <= 0) return { text: formatted, relative: 'Overdue', urgent: true };
  if (diffDays === 1) return { text: formatted, relative: 'Tomorrow', urgent: false };
  if (diffDays <= 7) return { text: formatted, relative: `${diffDays} days`, urgent: false };
  return { text: formatted, relative: null, urgent: false };
};

// Helper to get color based on probability
const getProbColor = (prob) => {
  if (prob === null) return { bg: 'bg-gray-100', text: 'text-gray-400' };
  if (prob <= 0.2) return { bg: 'bg-red-100', text: 'text-red-700' };
  if (prob <= 0.4) return { bg: 'bg-orange-100', text: 'text-orange-700' };
  if (prob <= 0.6) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
  if (prob <= 0.8) return { bg: 'bg-lime-100', text: 'text-lime-700' };
  return { bg: 'bg-green-100', text: 'text-green-700' };
};

// Stat Card Component
const StatCard = ({ label, value, sublabel, onClick, active }) => (
  <button
    onClick={onClick}
    className={`bg-white border rounded-lg p-4 text-left transition-all hover:shadow-md ${
      active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
    }`}
  >
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
    {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
  </button>
);

// Upcoming Prop Row
const UpcomingPropRow = ({ prop }) => {
  const deadline = formatDeadline(prop.deadline);
  const colors = getProbColor(prop.yourForecast);
  const percent = prop.yourForecast !== null ? Math.round(prop.yourForecast * 100) : null;
  
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Forecast status indicator */}
      <div className={`w-12 h-10 rounded ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-bold shrink-0`}>
        {percent !== null ? `${percent}%` : '—'}
      </div>
      
      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{prop.title}</div>
        <div className="text-xs text-gray-500">
          Due {deadline.text}
          {deadline.relative && <span className="text-gray-400"> · {deadline.relative}</span>}
        </div>
      </div>
      
      {/* Action hint */}
      <div className="shrink-0">
        {percent === null ? (
          <span className="text-xs text-blue-600 font-medium">Forecast →</span>
        ) : (
          <span className="text-xs text-gray-400">Edit →</span>
        )}
      </div>
    </div>
  );
};

// Leaderboard Row
const LeaderboardRow = ({ entry, compact }) => (
  <div className={`flex items-center gap-3 py-2 ${entry.isYou ? 'font-medium' : ''}`}>
    <div className={`w-6 text-center text-sm ${entry.isYou ? 'text-blue-600' : 'text-gray-400'}`}>
      {entry.rank}
    </div>
    <div className={`flex-1 truncate ${entry.isYou ? 'text-blue-900' : 'text-gray-900'}`}>
      {entry.name}
      {entry.isYou && <span className="text-blue-500 text-xs ml-1">(you)</span>}
    </div>
    <div className={`text-sm font-mono ${entry.isYou ? 'text-blue-700' : 'text-gray-600'}`}>
      {entry.avgBrier.toFixed(3)}
    </div>
  </div>
);

// Tab Button
const TabButton = ({ active, children, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
    {count !== undefined && (
      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
        active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// ============================================
// VERSION A: Leaderboard as sidebar
// ============================================
const DashboardVersionA = ({ isAdmin }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Private
                </span>
              </div>
              <p className="text-sm text-gray-500">{competition.memberCount} members</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Prop
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {adminMenuOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Invite Members
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Manage Members
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Competition Settings
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
              Overview
            </TabButton>
            <TabButton active={activeTab === 'open'} onClick={() => setActiveTab('open')} count={stats.toForecast}>
              Open
            </TabButton>
            <TabButton active={activeTab === 'closed'} onClick={() => setActiveTab('closed')} count={stats.closed}>
              Closed
            </TabButton>
            <TabButton active={activeTab === 'resolved'} onClick={() => setActiveTab('resolved')} count={stats.resolved}>
              Resolved
            </TabButton>
            <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
              Leaderboard
            </TabButton>
            {isAdmin && (
              <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
                Members
              </TabButton>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard 
                label="To Forecast" 
                value={stats.toForecast}
                sublabel="Props need your prediction"
                onClick={() => setActiveTab('open')}
              />
              <StatCard 
                label="Closed" 
                value={stats.closed}
                sublabel="Awaiting resolution"
                onClick={() => setActiveTab('closed')}
              />
              <StatCard 
                label="Resolved" 
                value={stats.resolved}
                sublabel="Scored props"
                onClick={() => setActiveTab('resolved')}
              />
            </div>
            
            {/* Upcoming deadlines */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
                <button 
                  onClick={() => setActiveTab('open')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-1">
                {upcomingProps.map(prop => (
                  <UpcomingPropRow key={prop.id} prop={prop} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar - Leaderboard */}
          <div className="w-72 shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Leaderboard</h2>
                <span className="text-xs text-gray-400">Avg Brier</span>
              </div>
              <div className="space-y-1">
                {leaderboard.map(entry => (
                  <LeaderboardRow key={entry.rank} entry={entry} compact />
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 text-center"
              >
                Full leaderboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// VERSION B: Leaderboard inline, more compact
// ============================================
const DashboardVersionB = ({ isAdmin }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  // Find user's position
  const userEntry = leaderboard.find(e => e.isYou);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Private
                </span>
              </div>
              <p className="text-sm text-gray-500">{competition.memberCount} members</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Prop
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {adminMenuOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Invite Members
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Manage Members
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          Competition Settings
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
              Overview
            </TabButton>
            <TabButton active={activeTab === 'open'} onClick={() => setActiveTab('open')} count={stats.toForecast}>
              Open
            </TabButton>
            <TabButton active={activeTab === 'closed'} onClick={() => setActiveTab('closed')} count={stats.closed}>
              Closed
            </TabButton>
            <TabButton active={activeTab === 'resolved'} onClick={() => setActiveTab('resolved')} count={stats.resolved}>
              Resolved
            </TabButton>
            {isAdmin && (
              <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
                Members
              </TabButton>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Stats row - includes your rank */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Your Rank" 
            value={`#${userEntry.rank}`}
            sublabel={`of ${leaderboard.length} · ${userEntry.avgBrier.toFixed(3)} avg`}
            onClick={() => setActiveTab('leaderboard')}
          />
          <StatCard 
            label="To Forecast" 
            value={stats.toForecast}
            sublabel="Need your prediction"
            onClick={() => setActiveTab('open')}
          />
          <StatCard 
            label="Closed" 
            value={stats.closed}
            sublabel="Awaiting resolution"
            onClick={() => setActiveTab('closed')}
          />
          <StatCard 
            label="Resolved" 
            value={stats.resolved}
            sublabel="Scored"
            onClick={() => setActiveTab('resolved')}
          />
        </div>
        
        {/* Two-column layout for upcoming + top forecasters */}
        <div className="grid grid-cols-2 gap-6">
          {/* Upcoming deadlines */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
              <button 
                onClick={() => setActiveTab('open')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </button>
            </div>
            <div className="space-y-1">
              {upcomingProps.slice(0, 4).map(prop => (
                <UpcomingPropRow key={prop.id} prop={prop} />
              ))}
            </div>
          </div>
          
          {/* Leaderboard preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Leaderboard</h2>
              <span className="text-xs text-gray-400">Avg Brier ↓</span>
            </div>
            <div className="space-y-1">
              {leaderboard.slice(0, 5).map(entry => (
                <LeaderboardRow key={entry.rank} entry={entry} />
              ))}
            </div>
            {leaderboard.length > 5 && (
              <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 text-center">
                View all {leaderboard.length} members →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main export with version toggle
// ============================================
export default function CompetitionDashboard() {
  const [version, setVersion] = useState('A');
  const [isAdmin, setIsAdmin] = useState(true);
  
  return (
    <div>
      {/* Version toggle (for demo purposes) */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
        <div className="text-xs text-gray-500 mb-2">Demo Controls</div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setVersion('A')}
            className={`px-3 py-1 text-sm rounded ${version === 'A' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Layout A
          </button>
          <button
            onClick={() => setVersion('B')}
            className={`px-3 py-1 text-sm rounded ${version === 'B' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Layout B
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={isAdmin} 
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="rounded"
          />
          Admin view
        </label>
      </div>
      
      {version === 'A' ? (
        <DashboardVersionA isAdmin={isAdmin} />
      ) : (
        <DashboardVersionB isAdmin={isAdmin} />
      )}
    </div>
  );
}
