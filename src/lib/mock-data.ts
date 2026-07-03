import productFlowers from "@/assets/product-flowers.jpg";
import productFrame from "@/assets/product-frame.jpg";
import productCake from "@/assets/product-cake.jpg";
import productDryfruit from "@/assets/product-dryfruit.jpg";
import heroImg from "@/assets/hero-giftbox.jpg";
import boxBuilderImg from "@/assets/box-builder.jpg";

export const heroImage = heroImg;
export const boxBuilderImage = boxBuilderImg;

export type MockProduct = {
  slug: string;
  name: string;
  image: string;
  price: number; // in rupees
  mrp?: number;
  rating: number;
  ratingCount: number;
  badge?: string;
  personalizable?: boolean;
};

export const products: MockProduct[] = [
  { slug: "blush-bloom-bouquet", name: "Blush & Bloom Bouquet", image: productFlowers, price: 1499, mrp: 1899, rating: 4.5, ratingCount: 1240, badge: "Same Day" },
  { slug: "eternal-frame-keepsake", name: "Eternal Frame Keepsake", image: productFrame, price: 899, mrp: 1299, rating: 4.6, ratingCount: 812, badge: "Personalized", personalizable: true },
  { slug: "midnight-belgian-truffle", name: "Midnight Belgian Truffle Cake", image: productCake, price: 1199, mrp: 1499, rating: 4.7, ratingCount: 2130, badge: "Midnight" },
  { slug: "imperial-dry-fruit-casket", name: "Imperial Dry Fruit Casket", image: productDryfruit, price: 2499, mrp: 2999, rating: 4.4, ratingCount: 645, badge: "Festival" },
  { slug: "sunshine-roses-vase", name: "Sunshine Roses in Glass Vase", image: productFlowers, price: 1799, mrp: 2199, rating: 4.3, ratingCount: 380 },
  { slug: "engraved-couple-frame", name: "Engraved Couple Frame", image: productFrame, price: 1099, rating: 4.8, ratingCount: 512, badge: "Personalized", personalizable: true },
  { slug: "red-velvet-heart-cake", name: "Red Velvet Heart Cake 500g", image: productCake, price: 899, mrp: 1099, rating: 4.6, ratingCount: 1980 },
  { slug: "royal-nut-hamper", name: "Royal Nut & Chocolate Hamper", image: productDryfruit, price: 1899, mrp: 2299, rating: 4.5, ratingCount: 720, badge: "Hamper" },
];

export const occasions = [
  { slug: "birthday", name: "Birthday", emoji: "🎂" },
  { slug: "anniversary", name: "Anniversary", emoji: "💍" },
  { slug: "wedding", name: "Wedding", emoji: "💐" },
  { slug: "rakhi", name: "Rakhi", emoji: "🪢" },
  { slug: "diwali", name: "Diwali", emoji: "🪔" },
  { slug: "corporate", name: "Corporate", emoji: "🏢" },
];

export const recipients = [
  { slug: "him", name: "For Him" },
  { slug: "her", name: "For Her" },
  { slug: "kids", name: "For Kids" },
  { slug: "parents", name: "For Parents" },
  { slug: "couple", name: "For Couple" },
  { slug: "colleagues", name: "Colleagues" },
];

export const categories = [
  { slug: "personalized", name: "Personalized" },
  { slug: "flowers", name: "Flowers" },
  { slug: "cakes", name: "Cakes" },
  { slug: "chocolates", name: "Chocolates" },
  { slug: "hampers", name: "Hampers" },
  { slug: "corporate", name: "Corporate" },
];

export function formatPrice(rupees: number) {
  return `₹${rupees.toLocaleString("en-IN")}`;
}
