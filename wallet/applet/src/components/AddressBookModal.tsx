import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookUser,
  Plus,
  Search,
  X,
  Copy,
  Check,
  Send,
  Trash2,
  Edit2,
  QrCode,
  User,
  Store,
  Boxes,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { ContactAddress, WalletVault } from '../types';
import { encryptStorage } from '../services/EncryptStorage';
import { QrScannerModal } from './QrScannerModal';

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: WalletVault;
  onUpdateVault: (updated: WalletVault) => void;
  onSelectContactForSend?: (address: string) => void;
}

const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-indigo-600',
  'from-pink-500 to-rose-600',
];

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  isOpen,
  onClose,
  vault,
  onUpdateVault,
  onSelectContactForSend,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [isAddingOrEditing, setIsAddingOrEditing] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<ContactAddress | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [addressInput, setAddressInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<'personal' | 'merchant' | 'pool' | 'exchange' | 'other'>('personal');
  const [noteInput, setNoteInput] = useState<string>('');
  const [avatarColorInput, setAvatarColorInput] = useState<string>(AVATAR_COLORS[0]);

  // QR Scanner Modal State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const contacts = vault.contacts || [];

  const filteredContacts = contacts.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingContact(null);
    setNameInput('');
    setAddressInput('');
    setCategoryInput('personal');
    setNoteInput('');
    setAvatarColorInput(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setIsAddingOrEditing(true);
  };

  const handleOpenEdit = (contact: ContactAddress) => {
    setEditingContact(contact);
    setNameInput(contact.name);
    setAddressInput(contact.address);
    setCategoryInput(contact.category || 'personal');
    setNoteInput(contact.note || '');
    setAvatarColorInput(contact.avatarColor || AVATAR_COLORS[0]);
    setIsAddingOrEditing(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !addressInput.trim()) return;

    const updatedVault = encryptStorage.updateVault((prev) => {
      const existingContacts = prev.contacts || [];
      let nextContacts: ContactAddress[];

      if (editingContact) {
        nextContacts = existingContacts.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                name: nameInput.trim(),
                address: addressInput.trim(),
                category: categoryInput,
                note: noteInput.trim(),
                avatarColor: avatarColorInput,
              }
            : c
        );
      } else {
        const newContact: ContactAddress = {
          id: `contact_${Date.now()}`,
          name: nameInput.trim(),
          address: addressInput.trim(),
          category: categoryInput,
          note: noteInput.trim(),
          avatarColor: avatarColorInput,
          createdAt: new Date().toISOString(),
        };
        nextContacts = [newContact, ...existingContacts];
      }

      return {
        ...prev,
        contacts: nextContacts,
      };
    });

    onUpdateVault(updatedVault);
    setIsAddingOrEditing(false);
  };

  const handleDeleteContact = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    const updatedVault = encryptStorage.updateVault((prev) => ({
      ...prev,
      contacts: (prev.contacts || []).filter((c) => c.id !== id),
    }));

    onUpdateVault(updatedVault);
  };

  const handleSelectForSend = (address: string) => {
    if (onSelectContactForSend) {
      onSelectContactForSend(address);
      onClose();
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'merchant':
        return { label: 'Merchant', icon: Store, bg: 'bg-amber-950/80 text-amber-400 border-amber-800/50' };
      case 'pool':
        return { label: 'Liquidity Pool', icon: Boxes, bg: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/50' };
      case 'exchange':
        return { label: 'Exchange Payee', icon: ShieldCheck, bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50' };
      default:
        return { label: 'Personal', icon: User, bg: 'bg-purple-950/80 text-purple-400 border-purple-800/50' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-md bg-[#1A1D24] border border-[#262B36] rounded-2xl p-5 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262B36] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Address Book</h3>
              <p className="text-[10px] text-gray-400">Manage saved TARCOIN recipient contacts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingOrEditing && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#0F1115] flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {isAddingOrEditing ? (
            /* ADD / EDIT FORM */
            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div className="p-3 bg-[#0F1115] border border-[#262B36] rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {editingContact ? 'Edit Contact' : 'New Contact Entry'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingOrEditing(false)}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Alice's Hardware Wallet"
                  className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    TARCOIN Address *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="text-[10px] text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan QR Code</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="tar1q..."
                  className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Category Tag
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(
                    [
                      { id: 'personal', label: 'Personal' },
                      { id: 'merchant', label: 'Merchant' },
                      { id: 'pool', label: 'Liquidity Pool' },
                      { id: 'exchange', label: 'Exchange Payee' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryInput(cat.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        categoryInput === cat.id
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-[#0F1115] text-gray-400 border-[#262B36]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Note / Label (Optional)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. Monthly recurring node payout"
                  className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Avatar Gradient Picker */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Avatar Color Style
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarColorInput(color)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${color} border-2 transition-transform ${
                        avatarColorInput === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOrEditing(false)}
                  className="flex-1 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20"
                >
                  Save Contact
                </button>
              </div>
            </form>
          ) : (
            /* CONTACTS LIST */
            <div className="space-y-3">
              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contact name or address..."
                    className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'personal', label: 'Personal' },
                      { id: 'merchant', label: 'Merchants' },
                      { id: 'pool', label: 'Pools' },
                      { id: 'exchange', label: 'Exchanges' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'bg-[#0F1115] text-gray-400 border border-[#262B36] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards List */}
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center bg-[#0F1115] border border-[#262B36] rounded-2xl space-y-2">
                  <BookUser className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">No contacts found</p>
                  <p className="text-[10px] text-gray-500">
                    Click 'Add Contact' above to save your first recipient.
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const categoryBadge = getCategoryBadge(contact.category);
                  const Icon = categoryBadge.icon;

                  return (
                    <div
                      key={contact.id}
                      className="p-3.5 bg-[#0F1115] border border-[#262B36] hover:border-cyan-800/40 rounded-2xl space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {/* Avatar Circle */}
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                              contact.avatarColor || 'from-cyan-500 to-blue-600'
                            } flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                          >
                            {contact.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{contact.name}</h4>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 ${categoryBadge.bg}`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                <span>{categoryBadge.label}</span>
                              </span>
                            </div>

                            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px] mt-0.5">
                              {contact.address}
                            </p>
                          </div>
                        </div>

                        {/* Action Tools */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(contact)}
                            className="p-1.5 rounded-lg bg-[#1A1D24] text-gray-400 hover:text-white transition-colors"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 rounded-lg bg-[#1A1D24] text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {contact.note && (
                        <p className="text-[10px] text-cyan-300/80 italic bg-[#1A1D24]/60 p-2 rounded-lg">
                          "{contact.note}"
                        </p>
                      )}

                      {/* Bottom Quick Actions Bar */}
                      <div className="pt-2 border-t border-[#262B36] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(contact.id, contact.address)}
                          className="px-2.5 py-1 rounded-lg bg-[#1A1D24] text-gray-300 hover:text-cyan-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                        >
                          {copiedId === contact.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-cyan-400" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectForSend(contact.address)}
                          className="px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send TAR</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* QR Code Scanner for inputting address when adding/editing */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={(address) => setAddressInput(address)}
      />
    </div>
  );
};
