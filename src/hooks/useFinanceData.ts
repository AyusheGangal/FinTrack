import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Account, Transaction, Budget, Reminder } from '../types';

export function useFinanceData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', userId));
    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('date', 'desc'));
    const qBudgets = query(collection(db, 'budgets'), where('userId', '==', userId));
    const qReminders = query(collection(db, 'reminders'), where('userId', '==', userId), orderBy('dueDate', 'asc'));

    const unsubAccounts = onSnapshot(qAccounts, (sn) => {
      setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    });

    const unsubTransactions = onSnapshot(qTransactions, (sn) => {
      setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    const unsubBudgets = onSnapshot(qBudgets, (sn) => {
      setBudgets(sn.docs.map(d => ({ id: d.id, ...d.data() } as Budget)));
    });

    const unsubReminders = onSnapshot(qReminders, (sn) => {
      setReminders(sn.docs.map(d => ({ id: d.id, ...d.data() } as Reminder)));
      setLoading(false);
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubBudgets();
      unsubReminders();
    };
  }, []);

  return { accounts, transactions, budgets, reminders, loading };
}
