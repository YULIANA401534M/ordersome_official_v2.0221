import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Create category for chili sauce
    await connection.execute(
      `INSERT INTO categories (name, slug, description, isActive, sortOrder, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['辣椒醬系列', 'chili-sauce', '來點什麼 X 永豐 台韓辣椒醬', true, 1]
    );
    
    // Get category ID
    const [cats] = await connection.execute(`SELECT id FROM categories WHERE slug = 'chili-sauce'`);
    const categoryId = cats[0]?.id || 1;
    
    // Create products
    const products = [
      {
        name: '台韓辣椒醬（單瓶）',
        slug: 'korean-chili-sauce-single',
        description: '來點什麼 X 永豐聯名款，融合台灣與韓國風味的獨特辣椒醬，280ml 裝。嚴選優質辣椒，手工熬製，香辣順口，是拌飯、拌麵、沾醬的最佳選擇。',
        price: '239',
        imageUrl: '/products/chili-sauce-1.jpg',
        stock: 100,
        isActive: true,
        isFeatured: true,
        sortOrder: 1
      },
      {
        name: '台韓辣椒醬（兩入組）',
        slug: 'korean-chili-sauce-double',
        description: '來點什麼 X 永豐聯名款，兩入優惠組合。融合台灣與韓國風味的獨特辣椒醬，280ml x 2 瓶。送禮自用兩相宜，限量優惠中。',
        price: '398',
        imageUrl: '/products/chili-sauce-2.jpg',
        stock: 50,
        isActive: true,
        isFeatured: true,
        sortOrder: 2
      }
    ];
    
    for (const product of products) {
      await connection.execute(
        `INSERT INTO products (categoryId, name, slug, description, price, imageUrl, stock, isActive, isFeatured, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           description = VALUES(description),
           price = VALUES(price),
           imageUrl = VALUES(imageUrl)`,
        [categoryId, product.name, product.slug, product.description, product.price, product.imageUrl, product.stock, product.isActive, product.isFeatured, product.sortOrder]
      );
    }
    
    console.log('Products seeded successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await connection.end();
  }
}

seed();
