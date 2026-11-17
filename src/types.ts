export interface ProductOption {
  qty: number;
  price: number;
  label: string;
  badge?: string;
  name: string;
  description: string;
  image: string;
  gallery: string[];
  checkoutUrl: string;
}

export interface Review {
  name: string;
  date: string;
  text: string;
  avatar: string | null;
  photos?: string[];
}

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export interface CheckoutCustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

export interface CheckoutShippingData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}
