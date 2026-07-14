import { useState } from "react";
import { Send, Landmark, ArrowUpRight, ArrowDownLeft, X, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentsPanel({ contacts }) {
  const [paymentBalance, setPaymentBalance] = useState(250.00);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRecipient, setPayRecipient] = useState("");
  const [transactions, setTransactions] = useState([
    { id: 1, type: "received", name: "Abhinash", amount: 15.00, time: "Yesterday, 3:14 PM" },
    { id: 2, type: "sent", name: "CSE Group", amount: 45.00, time: "2 days ago" },
  ]);

  const handleSendPayment = () => {
    const amt = parseFloat(payAmount);
    if (!payRecipient) return toast.error("Please choose a recipient");
    if (isNaN(amt) || amt <= 0) return toast.error("Please enter a valid amount");
    if (amt > paymentBalance) return toast.error("Insufficient balance");

    setPaymentBalance(prev => prev - amt);
    const targetContact = contacts.find(c => c._id === payRecipient);
    const name = targetContact ? targetContact.fullName : "Contact";
    setTransactions(prev => [
      { id: Date.now(), type: "sent", name, amount: amt, time: "Just now" },
      ...prev
    ]);
    setShowPayModal(false);
    setPayAmount("");
    setPayRecipient("");
    toast.success(`Sent $${amt.toFixed(2)} to ${name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="p-5 rounded-2xl flex flex-col justify-between h-[150px] relative overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", border: "1px solid var(--border)" }}>
        <div className="absolute right-4 top-4 text-white/10">
          <Landmark size={80} />
        </div>
        <div className="z-10">
          <p className="text-xs text-white/50 font-medium">TalkSphere Pay Balance</p>
          <p className="text-[32px] font-bold text-white mt-1">${paymentBalance.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 z-10">
          <button onClick={() => setShowPayModal(true)}
            className="flex-1 py-2 rounded-xl bg-[#00a884] hover:bg-[#009675] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors">
            <Send size={12} /> Send Money
          </button>
          <button onClick={() => toast.success("Bank linked successfully!")}
            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors">
            <Landmark size={12} /> Add Bank
          </button>
        </div>
      </div>

      {/* Transactions list */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 mt-5" style={{ color: "var(--text-muted)" }}>
          Recent Transactions
        </p>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="p-3.5 rounded-xl flex items-center justify-between border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "received" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"}`}>
                  {tx.type === "received" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <p className="text-white font-medium text-[13.5px]">
                    {tx.type === "received" ? `Received from ${tx.name}` : `Paid to ${tx.name}`}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{tx.time}</p>
                </div>
              </div>
              <span className={`text-[14px] font-bold ${tx.type === "received" ? "text-emerald-400" : "text-white"}`}>
                {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Modal Dialog */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            key="pay-modal-container"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl text-left"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-[16px]">Send Money</h3>
                <button onClick={() => setShowPayModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Select recipient</label>
                  <select
                    value={payRecipient}
                    onChange={e => setPayRecipient(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-white text-[13px] outline-none"
                  >
                    <option value="">-- Choose Contact --</option>
                    {contacts.map(c => (
                      <option key={c._id} value={c._id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Amount ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 pl-8 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-white text-[13px] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-white/70 hover:bg-white/5"
                  style={{ borderColor: "var(--border)" }}>
                  Cancel
                </button>
                <button onClick={handleSendPayment}
                  className="flex-1 py-2.5 bg-[#00a884] hover:bg-[#009675] text-white font-bold rounded-xl text-[13px] transition-colors">
                  Confirm Pay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
