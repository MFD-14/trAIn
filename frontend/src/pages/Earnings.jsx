import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../utils/api';
import { useEarningsStore } from '../store';
import { DollarSign, TrendingUp, Download, History } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';

const Earnings = () => {
  const { balance, setBalance, transactions, setTransactions, earningsBreakdown, setEarningsBreakdown } = useEarningsStore();
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      const [balanceRes, transactionsRes, breakdownRes] = await Promise.all([
        paymentsAPI.getBalance(),
        paymentsAPI.getPaymentHistory({ limit: 20 }),
        paymentsAPI.getEarningsBreakdown()
      ]);

      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data.transactions);
      setEarningsBreakdown(breakdownRes.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (amount < 10) {
      alert('Minimum withdrawal amount is $10.00');
      return;
    }

    if (amount > balance.availableBalance) {
      alert('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      await paymentsAPI.requestWithdrawal({ amount });
      alert('Withdrawal request submitted successfully!');
      setShowWithdraw(false);
      setWithdrawAmount('');
      fetchEarningsData();
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert(error.response?.data?.error?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Manage your balance and withdrawals</p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">Total Earnings</span>
            <DollarSign size={24} />
          </div>
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(balance.totalEarnings)}
          </div>
          <p className="text-green-100 text-sm">Lifetime earnings</p>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100">Pending</span>
            <TrendingUp size={24} />
          </div>
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(balance.pendingEarnings)}
          </div>
          <p className="text-yellow-100 text-sm">Under review</p>
        </div>

        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-primary-100">Available</span>
            <Download size={24} />
          </div>
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(balance.availableBalance)}
          </div>
          <p className="text-primary-100 text-sm">Ready to withdraw</p>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="card">
        {!showWithdraw ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Withdraw Funds</h2>
              <p className="text-gray-600 text-sm">
                Minimum withdrawal: $10.00
              </p>
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={balance.availableBalance < 10}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    max={balance.availableBalance}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input-field pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(balance.availableBalance)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="btn-primary flex-1"
                >
                  {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
                <button
                  onClick={() => {
                    setShowWithdraw(false);
                    setWithdrawAmount('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Earnings Breakdown */}
      {earningsBreakdown && earningsBreakdown.byTaskType.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings by Task Type</h2>
          <div className="space-y-3">
            {earningsBreakdown.byTaskType.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-600">{item.taskCount} tasks</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(item.totalEarned)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <History size={24} className="text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {txn.description || txn.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatRelativeTime(txn.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    txn.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {txn.type === 'withdrawal' ? '-' : '+'}{formatCurrency(txn.amount)}
                  </p>
                  <span className={`text-xs badge ${
                    txn.status === 'completed' ? 'badge-green' :
                    txn.status === 'pending' ? 'badge-yellow' : 'badge-red'
                  }`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
