'use client';

import { useState } from 'react';
import { updateUserPlan } from './actions';

export default function SuperAdminClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [updating, setUpdating] = useState(null);

  const handlePlanChange = async (userId, newPlan) => {
    setUpdating(userId);
    try {
      await updateUserPlan(userId, newPlan);
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err) {
      console.error(err);
      alert('Failed to update user plan.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-black/40 text-xs uppercase text-neutral-500 font-semibold tracking-wider border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Name / Email</th>
              <th className="px-6 py-4">Username (Path)</th>
              <th className="px-6 py-4">Current Plan</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-white">{user.name || 'No Name'}</div>
                  <div className="text-neutral-500 text-xs mt-1">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.username ? (
                    <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      /{user.username}
                    </a>
                  ) : (
                    <span className="text-neutral-600 italic">Not set up</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                    user.plan === 'agency' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                    user.plan === 'portfolio' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                  <select
                    disabled={updating === user.id}
                    value={user.plan}
                    onChange={(e) => handlePlanChange(user.id, e.target.value)}
                    className="bg-black/50 border border-white/10 text-white rounded-sm px-3 py-1.5 outline-none focus:border-white/30 disabled:opacity-50"
                  >
                    <option value="freelancer">Freelancer (Limited)</option>
                    <option value="agency">Agency (Unlimited)</option>
                    <option value="portfolio">Portfolio (No Private)</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-neutral-500">
                  No users found on the platform yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
