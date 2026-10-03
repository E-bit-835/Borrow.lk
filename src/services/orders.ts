import { api } from './api';
type PredictionMethod = 'OPEN_SOURCE_AI' | 'CUSTOM_ML' | 'GEMINI_AI';


export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  clientId?: string;
  providerId?: string;
  productId: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyRate: number;
  totalPrice: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';
  quantity?: number;
  predictionMethod?: PredictionMethod;
  predictionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    category: string;
    image: string;
    images: string[];
    location: string;
  };
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    city: string;
    district: string;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  provider: {
    id: string;
    name: string;
    phone?: string;
    city?: string;
    district?: string;
  };
  prediction?: {
    id: string;
    method: PredictionMethod;
    modelName: string;
    confidenceScore: number;
    result: any;
    inputData: any;
  } | null;
}

export interface CreateOrderInput {
  productId: string;
  startDate: string;
  endDate: string;
  quantity?: number;
  clientId?: string;
  predictionMethod?: PredictionMethod;
  /** Prediction already run for this rental; the server attaches it instead of re-running */
  predictionId?: string;
  predictionInputData?: Record<string, any>;
  predictionImageUrl?: string;
  notes?: string;
}

export const orderService = {
  async getAll(params?: {
    status?: string;
    clientId?: string;
    providerId?: string;
    userId?: string;
    search?: string;
  }): Promise<Order[]> {
    return api.get<Order[]>('/orders', params);
  },

  async getById(id: string): Promise<Order> {
    return api.get<Order>(`/orders/${id}`);
  },

  async create(data: CreateOrderInput): Promise<Order> {
    return api.post<Order>('/orders', data);
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return api.patch<Order>(`/orders/${id}/status`, { status });
  },
};
