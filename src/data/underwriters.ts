export interface Product {
  id: string;
  name: string;
  premium: number;
  description: string;
}

export interface Underwriter {
  id: string;
  name: string;
  products: Product[];
}

/**
 * Mock data standing in for a real underwriters/products source
 * (e.g. cush's GET /api/underwriters and GET /api/products, or a shared DB).
 */
export const underwriters: Underwriter[] = [
  {
    id: "britam",
    name: "Britam Insurance",
    products: [
      {
        id: "britam-third-party",
        name: "Third Party Cover",
        premium: 5000,
        description: "Basic third-party motor cover, valid 12 months.",
      },
      {
        id: "britam-comprehensive",
        name: "Comprehensive Cover",
        premium: 25000,
        description: "Full comprehensive motor cover, valid 12 months.",
      },
    ],
  },
  {
    id: "jubilee",
    name: "Jubilee Insurance",
    products: [
      {
        id: "jubilee-third-party",
        name: "Third Party Cover",
        premium: 4800,
        description: "Basic third-party motor cover, valid 12 months.",
      },
    ],
  },
];

export function findUnderwriter(id: string): Underwriter | undefined {
  return underwriters.find((u) => u.id === id);
}

export function findProduct(
  underwriterId: string,
  productId: string,
): Product | undefined {
  return findUnderwriter(underwriterId)?.products.find(
    (p) => p.id === productId,
  );
}
