import { getDb, query, queryOne, execute } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { sendPushToUser } from '../../lib/push';

export interface ConversationSummary {
  id: number;
  otherUserId: number;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
  listingId: number | null;
  listingTitle: string | null;
}

function toUnixSeconds(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Math.floor(numeric);
}

export async function listConversations(userId: number): Promise<ConversationSummary[]> {
  const rows = await query<{
    id: number;
    participant_one_id: number;
    participant_two_id: number;
    listing_id: number | null;
    last_message: string | null;
    last_message_at: number | null;
    listing_title: string | null;
  }>(
    `SELECT c.id, c.participant_one_id, c.participant_two_id, c.listing_id,
            (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
            (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message_at,
            (SELECT l.title FROM listings l WHERE l.id = c.listing_id) AS listing_title
     FROM conversations c
     WHERE c.participant_one_id = ? OR c.participant_two_id = ?
     ORDER BY last_message_at DESC`,
    [userId, userId],
  );
  const summaries: ConversationSummary[] = [];
  for (const row of rows) {
    const otherUserId = row.participant_one_id === userId ? row.participant_two_id : row.participant_one_id;
    const otherUser = await queryOne<{ full_name: string }>('SELECT full_name FROM users WHERE id = ?', [otherUserId]);
    const unread = Number(
      (await query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM messages WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
        [row.id, userId],
      ))[0]?.total ?? 0,
    );
    summaries.push({
      id: row.id,
      otherUserId,
      otherUserName: otherUser?.full_name ?? 'User',
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at ? toUnixSeconds(row.last_message_at) : null,
      unreadCount: unread,
      listingId: row.listing_id ?? null,
      listingTitle: row.listing_title ?? null,
    });
  }
  return summaries;
}

export async function getOrCreateConversation(userId: number, otherUserId: number, listingId?: number | null) {
  const db = getDb();
  const first = Math.min(userId, otherUserId);
  const second = Math.max(userId, otherUserId);
  const existing = await queryOne<{ id: number; listing_id: number | null }>(
    'SELECT id, listing_id FROM conversations WHERE participant_one_id = ? AND participant_two_id = ? LIMIT 1',
    [first, second],
  );
  let conversationId = existing?.id;
  if (!conversationId) {
    const info = await execute(
      'INSERT INTO conversations (participant_one_id, participant_two_id, listing_id, created_at) VALUES (?, ?, ?, ?)',
      [first, second, listingId ?? null, Math.floor(Date.now() / 1000)],
    );
    conversationId = Number(info.lastInsertRowid);
  } else if (listingId && !existing?.listing_id) {
    await execute('UPDATE conversations SET listing_id = ? WHERE id = ?', [listingId, conversationId]);
  }
  return conversationId;
}

export async function startConversation(userId: number, input: unknown) {
  const recipientId = Number((input as { recipientId?: unknown })?.recipientId);
  if (!Number.isInteger(recipientId) || recipientId <= 0) {
    throw badRequest('INVALID_RECIPIENT', 'Please choose a valid recipient');
  }
  if (recipientId === userId) {
    throw badRequest('CANNOT_MESSAGE_SELF', 'You cannot start a conversation with yourself');
  }
  const recipient = await queryOne<{ id: number; account_status: string }>('SELECT id, account_status FROM users WHERE id = ?', [recipientId]);
  if (!recipient) throw notFound('USER_NOT_FOUND', 'User not found');
  if (recipient.account_status !== 'active') {
    throw badRequest('RECIPIENT_UNAVAILABLE', 'This user is not available for messaging');
  }
  const rawListingId = Number((input as { listingId?: unknown })?.listingId);
  let listingId: number | null = null;
  if (Number.isInteger(rawListingId) && rawListingId > 0) {
    const listing = await queryOne<{ id: number }>('SELECT id FROM listings WHERE id = ?', [rawListingId]);
    if (listing) listingId = listing.id;
  }
  const conversationId = await getOrCreateConversation(userId, recipientId, listingId);
  return { conversationId };
}

export async function listMessages(conversationId: number, userId: number) {
  const conversation = await queryOne<{ id: number; participant_one_id: number; participant_two_id: number }>(
    'SELECT id, participant_one_id, participant_two_id FROM conversations WHERE id = ?',
    [conversationId],
  );
  if (!conversation) throw notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
  if (conversation.participant_one_id !== userId && conversation.participant_two_id !== userId) {
    throw Object.assign(new Error('NOT_CONVERSATION_PARTICIPANT'), { statusCode: 403, code: 'NOT_CONVERSATION_PARTICIPANT' });
  }
  const messages = await query<{ id: number; sender_id: number; content: string; is_read: number; created_at: number }>(
    'SELECT id, sender_id, content, is_read, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId],
  );
  const db = getDb();
  await execute('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0', [conversationId, userId]);
  return messages.map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    content: message.content,
    isRead: message.is_read === 1,
    createdAt: toUnixSeconds(message.created_at),
  }));
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw badRequest('MESSAGE_INVALID', 'Message must be between 1 and 2000 characters');
  }
  const conversation = await queryOne<{ participant_one_id: number; participant_two_id: number }>(
    'SELECT participant_one_id, participant_two_id FROM conversations WHERE id = ?',
    [conversationId],
  );
  if (!conversation) throw notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
  if (conversation.participant_one_id !== senderId && conversation.participant_two_id !== senderId) {
    throw Object.assign(new Error('NOT_CONVERSATION_PARTICIPANT'), { statusCode: 403, code: 'NOT_CONVERSATION_PARTICIPANT' });
  }
  const info = await execute(
    'INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 0, ?)',
    [conversationId, senderId, trimmed, Math.floor(Date.now() / 1000)],
  );
  const messageId = Number(info.lastInsertRowid);
  const otherUserId = conversation.participant_one_id === senderId ? conversation.participant_two_id : conversation.participant_one_id;
  const sender = await queryOne<{ full_name: string }>('SELECT full_name FROM users WHERE id = ?', [senderId]);
  await execute(
    'INSERT INTO notifications (user_id, type, title, body, target_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [
      otherUserId,
      'MESSAGE_RECEIVED',
      'رسالة جديدة',
      `لديك رسالة جديدة من ${sender?.full_name ?? 'مستخدم'}.`,
      `/dashboard/messages/${conversationId}`,
      Math.floor(Date.now() / 1000),
    ],
  );
  void sendPushToUser(otherUserId, {
    title: `رسالة جديدة من ${sender?.full_name ?? 'مستخدم'}`,
    body: trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed,
    url: `/dashboard/messages/${conversationId}`,
    tag: `message-${conversationId}`,
  });
  return { id: messageId };
}
