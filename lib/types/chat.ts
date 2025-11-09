export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  assistantType?: string;
}

export interface ChatResponse {
  response: string;
  assistantType: string;
}

export interface IcebreakersResponse {
  temas: string[];
  dicaDoDia?: string;
  geradoEm?: string;
}