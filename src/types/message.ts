export type MessageSender = {
  id: string;
  name: string;
  role: 'passenger' | 'driver';
};

export type Message = {
  id: string;
  roomId: string;
  sender: MessageSender;
  text: string;
  createdAt: string;
};