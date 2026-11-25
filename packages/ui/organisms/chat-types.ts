export interface TextChatMessageContent {
  kind: 'text';
  text: string;
}

export interface LocationChatMessageContent {
  kind: 'location';
  mapUrl: string;
  label?: string;
}

export type ChatMessageContent = TextChatMessageContent | LocationChatMessageContent;

export interface ChatWindowMessage {
  id: string;
  senderId: string;
  senderName: string;
  sentAt: string;
  content: ChatMessageContent;
}
