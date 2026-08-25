import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '../types';
import { Card, Button, Input } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import { Send, User, MessageCircle } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';
  const currentReceiver = isAdmin ? (selectedUser || '') : 'admin';

  const fetchChats = async () => {
    if (isAdmin && !selectedUser) return;
    try {
      const res = await fetch('/api/chats', { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (Array.isArray(data)) {
        // If admin, filter by selected user
        if (isAdmin) {
          setChats(data.filter(c => c.sender_username === selectedUser || c.receiver_username === selectedUser));
        } else {
          setChats(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chats');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/chats/users', { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error('Failed to fetch chat users');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin && !selectedUser) return;
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || (isAdmin && !selectedUser)) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_username: currentReceiver,
          message: message.trim()
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Gagal mengirim');
      
      setMessage('');
      fetchChats();
    } catch (error) {
      toast.error('Gagal mengirim pesan');
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat chat...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex gap-4">
      {isAdmin && (
        <Card className="w-1/3 flex flex-col p-0 overflow-hidden bg-white border-gray-100 shadow-xl">
          <div className="p-4 border-b font-bold bg-gray-50 text-emerald-600">Users</div>
          <div className="flex-grow overflow-y-auto">
            {users.map(u => (
              <button 
                key={u} 
                onClick={() => setSelectedUser(u)}
                className={cn("w-full p-4 text-left border-b hover:bg-emerald-50", selectedUser === u ? "bg-emerald-100" : "")}
              >
                {u}
              </button>
            ))}
          </div>
        </Card>
      )}
      <Card className="flex-grow flex flex-col p-0 overflow-hidden bg-white border-gray-100 shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-50 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">{isAdmin ? (selectedUser || 'Pilih user') : 'Chat Bantuan'}</p>
              <p className="text-xs text-white/70">Online • Balas secepat mungkin</p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {!selectedUser && isAdmin ? (
             <div className="h-full flex items-center justify-center text-gray-400">Pilih pengguna untuk mulai chat</div>
          ) : chats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
              <MessageCircle className="w-12 h-12" />
              <p>Belum ada percakapan.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isMine = chat.sender_username === user?.username;
              return (
                <div key={chat.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl shadow-sm",
                    isMine 
                      ? "bg-emerald-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                  )}>
                    <p className="text-sm">{chat.message}</p>
                    <p className={cn("text-[10px] mt-2 opacity-70", isMine ? "text-right" : "")}>
                      {formatDate(chat.timestamp)}
                    </p>
                  </div>
                  {!isMine && <p className="text-[10px] text-gray-400 mt-1 ml-1 font-bold">{chat.sender_username}</p>}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Action Area */}
        {(!isAdmin || selectedUser) && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-3">
            <input
              type="text"
              placeholder="Ketik pesan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <Button type="submit" className="w-12 h-12 p-0 rounded-full">
              <Send className="w-5 h-5 text-white" />
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
