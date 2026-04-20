import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Account, Transaction, Budget, Reminder } from '../types';
import { format } from 'date-fns';

export const generateFinancialSummary = (
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  reminders: Reminder[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text('FinTrack Pro - Financial Export', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 20, 28);
  doc.text('This document contains a structured summary of your financial data for AI Agents.', 20, 33);

  let currentY = 45;

  // 1. Portfolio Overview
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('1. Portfolio Overview', 20, currentY);
  currentY += 10;

  const totalNetWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  doc.setFontSize(12);
  doc.text(`Total Net Worth: $${totalNetWorth.toLocaleString()}`, 25, currentY);
  currentY += 15;

  autoTable(doc, {
    startY: currentY,
    head: [['Account Name', 'Type', 'Balance']],
    body: accounts.map(a => [a.name, a.type.toUpperCase(), `$${a.balance.toLocaleString()}`]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 2. Budget Targets
  doc.setFontSize(16);
  doc.text('2. Budget Performance', 20, currentY);
  currentY += 10;

  const currentMonthTransactions = transactions.filter(t => 
    new Date(t.date).getMonth() === new Date().getMonth() && t.type === 'outflow'
  );

  const budgetData = budgets.map(b => {
    const spent = currentMonthTransactions
      .filter(t => t.category === b.category)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const percent = ((spent / b.limit) * 100).toFixed(0);
    return [b.category, `$${b.limit.toLocaleString()}`, `$${spent.toLocaleString()}`, `${percent}%`];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Limit', 'Spent', 'Utilization']],
    body: budgetData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 3. Recent Transactions
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(16);
  doc.text('3. Recent Ledger History', 20, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: transactions.slice(0, 30).map(t => [
      format(new Date(t.date), 'MMM dd'),
      t.description,
      t.category,
      t.type.toUpperCase(),
      `$${t.amount.toLocaleString()}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Footer on each page or just end
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Privacy Notice: This data is for your personal use. Protect this document as it contains sensitive financial info.', pageWidth / 2, 285, { align: 'center' });

  doc.save(`FinTrack_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
