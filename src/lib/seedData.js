import { collection, writeBatch, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const sampleProducts = [
  { name: '봄 가디건', price: 39000, stock: 25, imageUrl: '', category: '의류', options: 'S,M,L,XL', isLive: true },
  { name: '여름 원피스', price: 52000, stock: 15, imageUrl: '', category: '의류', options: 'S,M,L', isLive: true },
  { name: '실크 스카프', price: 25000, stock: 40, imageUrl: '', category: '잡화', options: '핑크,아이보리,네이비', isLive: true },
  { name: '미니 크로스백', price: 35000, stock: 20, imageUrl: '', category: '잡화', options: '블랙,브라운,베이지', isLive: false },
  { name: '수분 크림', price: 32000, stock: 50, imageUrl: '', category: '화장품', options: '50ml,100ml', isLive: true },
  { name: '비타민C 세럼', price: 28000, stock: 35, imageUrl: '', category: '화장품', options: '30ml', isLive: true },
  { name: '콜라겐 젤리', price: 45000, stock: 100, imageUrl: '', category: '건강식품', options: '1박스,3박스', isLive: true },
  { name: '유산균 스틱', price: 38000, stock: 80, imageUrl: '', category: '건강식품', options: '30포,60포', isLive: false },
];

const sampleOrders = [
  { buyerName: '김민지', phone: '010-1234-5678', address: '서울 강남구 역삼동 123', productName: '봄 가디건', price: 39000, option: 'M', status: 'new' },
  { buyerName: '이수진', phone: '010-2345-6789', address: '경기 성남시 분당구 정자동 45', productName: '수분 크림', price: 32000, option: '100ml', status: 'new' },
  { buyerName: '박지원', phone: '010-3456-7890', address: '서울 마포구 합정동 67', productName: '실크 스카프', price: 25000, option: '핑크', status: 'paid' },
  { buyerName: '최예린', phone: '010-4567-8901', address: '인천 연수구 송도동 89', productName: '콜라겐 젤리', price: 45000, option: '3박스', status: 'paid' },
  { buyerName: '정하나', phone: '010-5678-9012', address: '부산 해운대구 우동 12', productName: '여름 원피스', price: 52000, option: 'L', status: 'shipping' },
  { buyerName: '윤서영', phone: '010-6789-0123', address: '대구 수성구 범어동 34', productName: '비타민C 세럼', price: 28000, option: '30ml', status: 'done' },
];

export async function seedSampleData() {
  const productsSnap = await getDocs(collection(db, 'products'));
  if (!productsSnap.empty) {
    console.log('Data already exists, skipping seed.');
    return { products: 0, orders: 0 };
  }

  const batch = writeBatch(db);
  const now = Timestamp.now();

  const productIds = [];
  for (const product of sampleProducts) {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, { ...product, createdAt: now });
    productIds.push(ref.id);
  }

  for (let i = 0; i < sampleOrders.length; i++) {
    const order = sampleOrders[i];
    const ref = doc(collection(db, 'orders'));
    batch.set(ref, {
      ...order,
      productId: productIds[i % productIds.length],
      createdAt: now,
    });
  }

  await batch.commit();
  console.log(`Seeded ${sampleProducts.length} products and ${sampleOrders.length} orders.`);
  return { products: sampleProducts.length, orders: sampleOrders.length };
}
