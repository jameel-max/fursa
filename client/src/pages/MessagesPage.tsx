import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Inbox, MessageSquare, RefreshCw, Search, Send, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ChatMessage, Conversation } from '../types';
import { formatDateTime, timeAgo } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { Avatar, Badge, Card, PageHeader } from '../components/ui/Surfaces';

export function MessagesPage() {
  const { id } = useParams();
  const selectedId = id ? Number(id) : null;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const loadConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const data = await api<{ items: Conversation[] }>('/messages');
      setConversations(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل المحادثات.');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await api<{ items: ChatMessage[] }>(`/messages/${conversationId}`);
      setMessages(data.items);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        ),
      );
    } catch (err) {
      if (!silent) showToast(err instanceof Error ? err.message : 'تعذّر تحميل الرسائل.', 'error');
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadConversations(true);
      if (selectedId) void loadMessages(selectedId, true);
    }, 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(
      (conversation) =>
        conversation.otherUserName.toLowerCase().includes(query) ||
        (conversation.lastMessage ?? '').toLowerCase().includes(query),
    );
  }, [conversations, search]);

  const refreshAll = async () => {
    setRefreshing(true);
    await loadConversations(true);
    if (selectedId) await loadMessages(selectedId, true);
    setRefreshing(false);
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await api(`/messages/${selectedId}/messages`, {
        method: 'POST',
        body: { content: draft.trim() },
      });
      setDraft('');
      await loadMessages(selectedId, true);
      await loadConversations(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر إرسال الرسالة.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="الرسائل"
        description="تواصل مع الأطراف التي تتعامل معها عبر المنصة، مع حفظ سجل المحادثات."
        actions={
          <Button variant="secondary" loading={refreshing} icon={<RefreshCw size={15} />} onClick={() => void refreshAll()}>
            تحديث
          </Button>
        }
      />

      {error ? <Alert kind="error">{error}</Alert> : null}

      {loadingConversations ? (
        <LoadingBlock label="جارٍ تحميل المحادثات…" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={26} />}
          title="لا توجد محادثات بعد"
          description="يمكنك بدء محادثة من صفحة أي إعلان إذا كان الناشر قد فعّل الرسائل الداخلية."
          action={
            <Link to="/market" className="btn">
              <Search size={16} /> تصفح السوق
            </Link>
          }
        />
      ) : (
        <div className={selectedId ? 'messages-layout has-selection' : 'messages-layout'}>
          <aside className="conv-list" aria-label="قائمة المحادثات">
            <div style={{ padding: '0.65rem' }}>
              <input
                className="input"
                type="search"
                placeholder="ابحث في المحادثات"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="بحث في المحادثات"
              />
            </div>
            {filteredConversations.length === 0 ? (
              <p className="small muted" style={{ padding: '1rem' }}>
                لا توجد نتائج مطابقة.
              </p>
            ) : (
              filteredConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/dashboard/messages/${conversation.id}`}
                  className={conversation.id === selectedId ? 'conv-item active' : 'conv-item'}
                >
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <Avatar name={conversation.otherUserName} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="conv-head">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conversation.otherUserName}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <Badge tone="gold">{conversation.unreadCount}</Badge>
                        ) : (
                          <span className="small muted" style={{ fontWeight: 400 }}>
                            {conversation.lastMessageAt ? timeAgo(conversation.lastMessageAt) : ''}
                          </span>
                        )}
                      </div>
                      <div className="conv-preview">{conversation.lastMessage ?? 'لا توجد رسائل بعد'}</div>
                      {conversation.listingTitle ? (
                        <div className="conv-listing">
                          <Tag size={11} /> بخصوص: {conversation.listingTitle}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </aside>

          <section className="thread" aria-label="المحادثة">
            {!selectedId ? (
              <div className="empty" style={{ margin: 'auto' }}>
                <div className="empty-icon" aria-hidden="true">
                  <Inbox size={26} />
                </div>
                <h3>اختر محادثة</h3>
                <p>اختر محادثة من القائمة لعرض الرسائل والرد عليها.</p>
              </div>
            ) : loadingMessages ? (
              <LoadingBlock label="جارٍ تحميل الرسائل…" />
            ) : (
              <>
                <div className="thread-head">
                  <Link to="/dashboard/messages" className="thread-back icon-btn" aria-label="رجوع إلى المحادثات">
                    <ArrowRight size={18} />
                  </Link>
                  <div className="row">
                    <Avatar name={selected?.otherUserName ?? 'مستخدم'} />
                    <div>
                      <div className="strong">{selected?.otherUserName ?? `محادثة #${selectedId}`}</div>
                      <div className="small muted">
                        {selected?.listingTitle ? (
                          <>
                            بخصوص إعلان:{' '}
                            <Link to={`/market/${selected.listingId}`} className="conv-listing-link">
                              {selected.listingTitle}
                            </Link>
                          </>
                        ) : (
                          'محادثة داخلية محفوظة في المنصة'
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => void refreshAll()}
                    aria-label="تحديث الرسائل"
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>

                <div className="thread-body">
                  {messages.length === 0 ? (
                    <div className="empty" style={{ background: 'transparent', border: 0 }}>
                      <div className="empty-icon" aria-hidden="true">
                        <MessageSquare size={24} />
                      </div>
                      <h3>ابدأ المحادثة</h3>
                      <p>أرسل رسالة لبدء التنسيق حول المنتج أو موعد التسليم.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.senderId === user?.id;
                      return (
                        <div key={message.id} className={mine ? 'bubble mine' : 'bubble'}>
                          {!mine && message.senderName ? (
                            <div className="small" style={{ opacity: 0.75, fontWeight: 700 }}>
                              {message.senderName}
                            </div>
                          ) : null}
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
                          <time dateTime={new Date(message.createdAt * 1000).toISOString()}>
                            {formatDateTime(message.createdAt)}
                          </time>
                        </div>
                      );
                    })
                  )}
                  <div ref={endRef} />
                </div>

                <form className="thread-compose" onSubmit={send}>
                  <input
                    className="input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="اكتب رسالتك…"
                    maxLength={2000}
                    aria-label="نص الرسالة"
                  />
                  <Button
                    type="submit"
                    loading={sending}
                    disabled={!draft.trim()}
                    icon={<Send size={16} />}
                  >
                    إرسال
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <Card pad className="small muted">
        <strong>تنبيه: </strong>
        لا تشارك بياناتك البنكية عبر الرسائل. تحقق من المنتج قبل الدفع، واتفق على تفاصيل التسليم كتابياً.
      </Card>
    </div>
  );
}
