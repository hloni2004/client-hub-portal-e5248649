// E-Commerce Types

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface ProductColor {
  id: number;
  name: string;
  hexCode: string;
}

export interface ProductSize {
  id: number;
  name: string;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface ProductVariant {
  id: number;
  colorId: number;
  color: ProductColor;
  sizes: ProductSize[];
  images: string[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  salePrice?: number;
  sku: string;
  categoryId: number;
  category?: Category;
  brand?: string;
  tags?: string[];
  rating: number;
  reviewCount: number;
  variants: ProductVariant[];
  images: string[];
  isActive: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  productCount?: number;
  isActive: boolean;
}

export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  variantId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export enum AddressType {
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  addressType: AddressType;
  isDefault: boolean;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: number;
  productId: number;
  product: Product;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentId?: number;
  shipmentId?: number;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
}

export enum ShipmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
}

export interface ShipmentUpdate {
  status: ShipmentStatus;
  location?: string;
  description: string;
  timestamp: string;
}

export interface Shipment {
  id: number;
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  status: ShipmentStatus;
  estimatedDelivery?: string;
  updates: ShipmentUpdate[];
  createdAt: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
}

export interface SavedPaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethod;
  lastFourDigits?: string;
  cardType?: string;
  email?: string;
  bankName?: string;
  isDefault: boolean;
}

// Customer User extends base User
export interface Customer {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}
