import React, { useEffect, useState } from 'react';
import { usersAPI } from '../utils/api';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/helpers';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('all_time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getLeaderboard({ period, limit: 50 });
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-500';
    return 'from-gray-100 to-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Trophy className="text-yellow-500" size={36} />
            <span>Leaderboard</span>
          </h1>
          <p className="text-gray-600 mt-1">Top performers on trAIn</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="flex space-x-2">
          {['week', 'month', 'all_time'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* 2nd Place */}
              <div className="card bg-gradient-to-br from-gray-200 to-gray-300 order-2 md:order-1">
                <div className="text-center">
                  <div className="text-6xl mb-2">🥈</div>
                  <div className="bg-white bg-opacity-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700">2</span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {leaderboard[1].name}
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(leaderboard[1].totalEarned)}
                  </p>
                  <div className="text-sm text-gray-700">
                    <p>{leaderboard[1].tasksCompleted} tasks</p>
                    <p>{formatPercentage(leaderboard[1].averageAccuracy)} accuracy</p>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="card bg-gradient-to-br from-yellow-300 to-yellow-400 order-1 md:order-2 md:scale-105 md:-mt-4">
                <div className="text-center">
                  <div className="text-7xl mb-2">🥇</div>
                  <div className="bg-white bg-opacity-50 rounded-full w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                    <Trophy className="text-yellow-600" size={32} />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">
                    {leaderboard[0].name}
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(leaderboard[0].totalEarned)}
                  </p>
                  <div className="text-sm text-gray-700">
                    <p>{leaderboard[0].tasksCompleted} tasks</p>
                    <p>{formatPercentage(leaderboard[0].averageAccuracy)} accuracy</p>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="card bg-gradient-to-br from-orange-300 to-orange-400 order-3">
                <div className="text-center">
                  <div className="text-6xl mb-2">🥉</div>
                  <div className="bg-white bg-opacity-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700">3</span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {leaderboard[2].name}
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(leaderboard[2].totalEarned)}
                  </p>
                  <div className="text-sm text-gray-700">
                    <p>{leaderboard[2].tasksCompleted} tasks</p>
                    <p>{formatPercentage(leaderboard[2].averageAccuracy)} accuracy</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Full Rankings</h2>
            
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No data available for this period
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Trainer</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Tasks</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Accuracy</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getMedalEmoji(user.rank) && (
                              <span className="text-2xl">{getMedalEmoji(user.rank)}</span>
                            )}
                            <span className="font-semibold text-gray-900">
                              #{user.rank}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(user.rank)} flex items-center justify-center`}>
                              <Award className="text-white" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatPercentage(user.accuracyRating)} rating
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-medium text-gray-900">
                            {user.tasksCompleted}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-medium text-gray-900">
                            {formatPercentage(user.averageAccuracy)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-green-600">
                            {formatCurrency(user.totalEarned)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Motivational Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="text-center">
          <TrendingUp className="mx-auto mb-3" size={48} />
          <h3 className="text-2xl font-bold mb-2">Climb the Ranks!</h3>
          <p className="text-primary-100 mb-4">
            Complete more tasks with high accuracy to reach the top of the leaderboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
