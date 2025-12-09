import React, { memo } from 'react';

// SkillsSection as separate memoized component to prevent re-renders
const SkillsSection = memo(({ 
  skillsData, 
  skillsLoading, 
  skillsError,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  sortBy,
  setSortBy,
  handleSearchSkills,
  getSortedSkillsList,
  searchInputRef,
  fadeAnimation
}) => {
  const getCategory = (name = '') => {
    const n = name.toLowerCase();
    const softSkills = [
      'communication',
      'leadership',
      'teamwork',
      'management',
      'time',
      'problem',
      'adaptability',
      'creativity',
      'collaboration',
      'presentation',
      'writing',
      'speaking',
      'interpersonal',
      'negotiation'
    ];
    const webSkills = [
      'javascript',
      'vue', 'vue.js',
      'angular',
      'react', 'react.js',
      'frontend',
      'html', 'css'
    ];

    if (softSkills.some((k) => n.includes(k))) return 'Soft Skill';
    if (webSkills.some((k) => n.includes(k))) return 'Web Development';
    return 'Technical';
  };

  const formatSkillName = (name = '') => {
    const n = name.trim();
    const lower = n.toLowerCase();
    if (lower === 'nosql') return 'NoSQL';
    if (lower === 'react' || lower === 'react.js' || lower === 'reactjs') return 'React.js';
    if (lower === 'angular') return 'Angular';
    if (lower === 'vue' || lower === 'vue.js' || lower === 'vuejs') return 'Vue.js';
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  return (
  <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills & Technology Overview</h1>
      <p className="text-gray-600">Insights about skills entered by Students and Alumni during registration</p>
    </div>

    {skillsError && (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error loading skills data</p>
        <p className="text-sm mt-1">{skillsError}</p>
      </div>
    )}

    {skillsLoading ? (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills data...</p>
        </div>
      </div>
    ) : (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Unique Skills</p>
                <p className="text-4xl font-bold mt-2">{skillsData.summary.totalSkills}</p>
              </div>
              <div className="bg-blue-400 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Most Popular Skill</p>
                <p className="text-2xl font-bold mt-2">{skillsData.summary.mostPopularSkill?.skillName || 'N/A'}</p>
                <p className="text-green-100 text-sm mt-1">{skillsData.summary.mostPopularSkill?.userCount || 0} users</p>
              </div>
              <div className="bg-green-400 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Users with Skills</p>
                <p className="text-4xl font-bold mt-2">{skillsData.summary.totalUsersWithSkills}</p>
              </div>
              <div className="bg-purple-400 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Skills</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search skills by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSkills(e);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchSkills}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              Search
            </button>
            {searchResults.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">Found {searchResults.length} results for "{searchQuery}"</p>
          )}
        </div>

        {/* Top 5 Skills Chart */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {searchResults.length > 0 ? `Search Results - Top 5 Ranking` : 'Top 5 Skills by Popularity'}
          </h2>
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((skill, index) => {
                // Find the rank of this skill in the top 5
                const rankInTop5 = skillsData.top10Skills.slice(0, 5).findIndex(s => s.skillName === skill.skillName) + 1;
                const maxUsers = Math.max(...skillsData.top10Skills.slice(0, 5).map(s => s.userCount), 1);
                const percentage = (skill.userCount / maxUsers) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <p className="font-medium text-gray-900 truncate">{formatSkillName(skill.skillName)}</p>
                      {rankInTop5 > 0 ? (
                        <p className="text-sm text-green-600 font-semibold">#{rankInTop5} in Top 5</p>
                      ) : (
                        <p className="text-sm text-gray-500">Not in Top 5</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${rankInTop5 > 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right w-20">
                      <p className="font-semibold text-gray-900">{skill.userCount}</p>
                      <p className="text-xs text-gray-500">users</p>
                    </div>
                  </div>
                );
              })
            ) : (
              skillsData.top10Skills.slice(0, 5).map((skill, index) => {
                const maxUsers = skillsData.top10Skills[0]?.userCount || 1;
                const percentage = (skill.userCount / maxUsers) * 100;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <p className="font-medium text-gray-900 truncate">{formatSkillName(skill.skillName)}</p>
                      <p className="text-sm text-gray-500">#{index + 1} of 5</p>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right w-20">
                      <p className="font-semibold text-gray-900">{skill.userCount}</p>
                      <p className="text-xs text-gray-500">users</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Skills Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All Skills</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="popularity">Popularity (High to Low)</option>
                  <option value="name">Name (A to Z)</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600">Total: {getSortedSkillsList().length} skills</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Skill Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Number of Users</th>
                </tr>
              </thead>
              <tbody>
                {getSortedSkillsList().length > 0 ? (
                  getSortedSkillsList().map((skill, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatSkillName(skill.skillName)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {getCategory(skill.skillName)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="font-semibold text-gray-900">{skill.userCount}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No skills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Note:</span> This page displays read-only insights about skills entered by Students and Alumni. No editing, deletion, or addition of skills by admin is allowed.
          </p>
        </div>
      </>
    )}
  </div>
  );
});

SkillsSection.displayName = 'SkillsSection';

export default SkillsSection;
