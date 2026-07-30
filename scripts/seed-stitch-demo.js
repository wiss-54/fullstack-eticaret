#!/usr/bin/env node
/**
 * Stitch demo urunlerini API uzerinden basar.
 *
 * Ornek:
 *   API_BASE=https://eticaretshop.com.tr ADMIN_USER=admin ADMIN_PASSWORD='***' node scripts/seed-stitch-demo.js
 *
 * Mevcut urunleri silmeye calisir (siparis baglisi silinemeyenler atlanir),
 * sonra Stitch katalogunu stok + varyant + coklu gorselle ekler.
 */
/* eslint-disable no-console */

const API_BASE = (process.env.API_BASE || 'https://eticaretshop.com.tr').replace(/\/$/, '');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD gerekli');
  process.exit(1);
}

const IMG = {
  kulaklik1:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCazCM1ZZQ9I_-3OvqnAsDYY7p4Dob_NgmgZubkFhkvFIpnpnnPnL0aCm5UzQ2nnSxTek8t9x8oLipOUkMBzrJsimxDbUuLnN4z6-bFTidrw5OlBZROu8c1RukYScQI5NDcTqLGdyOGdCz4jQCTcfB0yAD9APvZ0iUWHETKx3GqqpePrEgsiAXKrA7if50kzFfQpIDWUiQ2faGTTKG1PP_zA8twYqcsOBYKgdHblPlSPwKZLVhywPtkVpra0XQogZXcXsxtl-BO0amN',
  kulaklik2:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAwGByC-hGMN0P33vFnBxr7thb7C8EuEocGZfQ4qvfAV061aCDbIlRjrsy3S_Xcd-Qc6d_HdB7BbAY75rV68CjL1NfpH8IgXww9HFbfumAYAYfG8YTZ3cNlDsAFarB5SwEZMeOs1LonUkOxHhnK0PdstMN5ti3oAzg5gI0PVlfQTVAsNHPP5AV3E-YoeV4Hda1DIj11vsm9QEGrFV6x5gdXSNR-vBjhVrdCj5x29rUlq9cwrV5Bi-jHogs8x8Jpx0sLznDezG_7Dr7B',
  saat1:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBMWaw3Xoxpo7Rw9tM3qbeoA3X53ioUu8QEYHi4DaLCGmXgwduYZMYxcFYaA_kvwQzRk6OHCBnxHfhMEqSdc1iTcMQ8BPJipyzrh_LXPc1cB_QV2rXD_w4FGcu_dzQdWv7MYM6zJgc8Fu-WhW6lnEiqgKdcpjf-Pvc7b9ubCiKwiWtOY6fShOEmXvBiIYjSQ50DVSfHFgQXHeJd7Y3lUU4WDlHG_9kq0awZ0m99u_xM3HvFSvo6sTAfiutA-488ZAN_-jZex1kVvSQc',
  saat2:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDOZ7A_U_S4Rb47cpz85D_z32PoxZL6MMMUAuM-ZB9z0YAfeosG-jzj7fl_ccDe6KTHQOhx15W67nG8PN9LPdPaIZmuOFOSpRNeoCs0FyenZm0ZZ0r4RMFBhFjcZBQ3xwxcVVXxkSVqd98okUvzDDOWVVU2CyMA_CTJQ_F2lhj7otwk8HphVbWF695drmt37mxWOVGG57UNActhOIfeoL1HwiU71onPZ3c7TtYWZUnEQp6zkvdu1Q7db_0kforxqKsRVqJ-pgJbNvkT',
  klavye:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBUrXyBuozpr7QArstuj1L-Uxl_4XBbK7XNimvx7cXbQq65UT7Xecuw9tHgBXnzCs0ep80mw4IzxkXRoO2RMJ51PENu5qgbh4oUrHNSKgKVEAbtsXGUxybYmILjatTjOva8bZ5rchSt9s3RA42SjYIy6tft_SeajSs0M7w0yF9UQLOZQoYqgOoqstoXrR6ivfmm5V_Ja2sMRepJsfhTaiUOHTuT6dYZze28hFiedczP5baaqbc_Sy7UDwA5mihS7ASc5B1YAkGkckUK',
  hoparlor:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDShyqh6RQ-Mi49Uu7In3BNMu3ZsmITMH-sSKfycWoLzEDNfEQ-CO2X147IG2S1DT8I9i69UVoPn7QkAmlKGxHe3rtoV2wlgZpl_tAZfPH2kvq6VhmUN-kfsVN8SP13acsZtgwQDUsDoNdVTffnrMFTZJErHMhIx8_w0sfqqVN5CCYdSLuTQS3u8CaMQE-aklSS8wrDRIg7n10F6qzGBO6P32k7AxIy0kRczNiCPm93tahUch6jhpMG70K6KOWB48XTPnzERMAGXPkN',
  trenckot:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC9DbXpiM4VFAIiKZgSUGtaOMEw42LrUAWpyFVuj4Xcs2_VlH13rACPD_35JnKHSff8fuaCDaBkHrbSJb5r6tCwsCtsXNZ-My2r2El73aCZh3aefym2UyumzqSIM2HIHcd8IJMLvuPOS0lXnPpMcGj856uWt7nJ-bCJg7y6-ow4a7aFjy8e7tzmz6M6Vh5D6awZUIIQHGn5xkutI7O1icW14R917NUDamiDtqZoxlWBYCavDrXC1-IxVtGUiC09EGLiIHRzvd580_D8',
  sneaker:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAdgGGwja_A6tpDtaBmrH-I_df5orJI07TZ9b-3x2al43zeRuJz6bXD0BnLbKQT0bYY0R0keeq5rA0mF8fWIhtqQ-zYjQm7IjS2M5jrl9a-UchPcHzJXqv8iOz-vsvudu0uMcRugMqy80jlu4-Dfa2cs17TCPWoDoODJrxSrDuCo8EhWjI8BJCq5an5eF88T6iKr2-8we-dow-xwT6EMHYAuVq--_lj1Un9uujhrZPB9Lt9fLY_YQFczvoV4cs2S12afxn-XWItP7oM',
  gomlek:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbmVF61ZiIEneGxNhGoFDhLl0p0nW8TTjFIHy2jVlzdmk7BeF5q-vzAlso1-NvlWCgN-MK4NaccKik-Nleq9hRK0T7UG5MOqcMcRIqSdm4GdI6il75P0_L-vLqCaZ8jrcLg-MQgfIL-IrYpC-uxvlRUShyAvi_ujBii-P8MO1YgPJq2hgHVqnj1nglmvojXU-JCLwFJZFs65SgobQg6l5UI6ywnIml-KeDhO26d-nsg9aLAY2-RnfzErq23JQ3y8VLcvA-vPfklGaS',
  canta:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCdmc5DPsGgbkbA0NRizZoOHelcq_pyts3aELYL9L2cUeSdoUViOmC1UEG5_g4CY3SWcdXGZ9NO4hW_kY06IpCwMceT-XavS84RQg0d3jSEjUVy9CjDxbgMqH13Mv4yFbnrNxWwLUXeqv9XbzSNqyZM3lh65jtOWK5-uWGAWijTCDSMHGWm80p-Mz30AYll9y98uDNQAK3NjrbSxG9Dyfwf0XS75E86s96jtaVSGHz5o1Rf6elUzBrIp6MmISKrN4Kl10qL0wRAH9LV',
  koltuk:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDUDFyjpVh6zdWKkAlflYPRInvA7zQUqaRmxugPPmYG31dRZsb92Bd8rbpl4gZ2pDqCp-oLBSPTMhkeEmohvV_1_ywDJdyyWtVD_SIsWW5d4VPTTcBG3POXZuh_wawwmbrWkhD1Ic_duTXs5h8AmcfHDFT4l1M40WBo3ySh7eSdaczPEneGQdeVIJ-mMYJut51T8HROffru-4y3_nazUtOZZZzwySMmEHOxKLS-s34BxmrFnkgdN8Lel1yDd1PPiQKZhOZPGm9xMxkG',
  lifestyle:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuABEtz3BZbeAQ4u4KiUxEn3q3zbJanOp0WBrzYJLB7c67U_lh8edPClcTsmQbIB9IxLVZNPhckLEHNk8z606vC69S06dJkxuwXm4gmAbFhgzm1iLat7Ilrt2ywXDe1flqwUsWnFqbqXJQbbEuhQJ0AxBB2dPN2lZft6koxazG2Q-q2NrzG1M3zW5q8c5bo4XxYWWG25MNZxSpQf3Dgc5VRz0-Sos92eB3i5rfgS4QOjdkV9FpgYRWvzmmjUGSiTSXBPm1hicQZvqbxp',
};

function colorAxis(values) {
  return {
    axes: [
      {
        name: 'Renk',
        displayStyle: 'color',
        sortOrder: 0,
        values: values.map((value, index) => ({
          label: value.label,
          colorHex: value.colorHex,
          sortOrder: index,
        })),
      },
    ],
    variants: values.map((value, index) => ({
      valueLabels: [value.label],
      stock: value.stock,
      sku: value.sku || null,
      price: null,
      isActive: true,
      sortOrder: index,
    })),
  };
}

function sizeAxis(name, values) {
  return {
    axes: [
      {
        name,
        displayStyle: 'button',
        sortOrder: 0,
        values: values.map((value, index) => ({
          label: value.label,
          colorHex: null,
          sortOrder: index,
        })),
      },
    ],
    variants: values.map((value, index) => ({
      valueLabels: [value.label],
      stock: value.stock,
      sku: value.sku || null,
      price: null,
      isActive: true,
      sortOrder: index,
    })),
  };
}

const CATEGORIES = ['Elektronik', 'Giyim', 'Aksesuar'];

const PRODUCTS = [
  {
    category: 'Elektronik',
    name: 'Premium Kablosuz Kulaklik',
    description:
      'Mat siyah premium kulaklik. Uzun pil omru, aktif gurultu engelleme ve stüdyo kalitesinde ses.',
    price: 2499,
    productType: 'variant',
    imageUrls: [IMG.kulaklik1, IMG.kulaklik2, IMG.lifestyle],
    variants: colorAxis([
      { label: 'Siyah', colorHex: '#111111', stock: 18, sku: 'KUL-SIYAH' },
      { label: 'Beyaz', colorHex: '#F5F5F5', stock: 12, sku: 'KUL-BEYAZ' },
      { label: 'Gri', colorHex: '#6B7280', stock: 10, sku: 'KUL-GRI' },
    ]),
  },
  {
    category: 'Elektronik',
    name: 'Akilli Saat Pro',
    description:
      'Firca aluminym kasa, spor kayis. Nabiz, uyku ve antrenman takibi. Gun boyu pil.',
    price: 2799,
    productType: 'variant',
    imageUrls: [IMG.saat1, IMG.saat2, IMG.lifestyle],
    variants: colorAxis([
      { label: 'Siyah', colorHex: '#111111', stock: 15, sku: 'SAAT-SIYAH' },
      { label: 'Gumus', colorHex: '#C0C0C0', stock: 10, sku: 'SAAT-GUMUS' },
      { label: 'Lacivert', colorHex: '#1E3A8A', stock: 8, sku: 'SAAT-LACI' },
    ]),
  },
  {
    category: 'Elektronik',
    name: 'Mekanik Klavye',
    description:
      'Sicak gri ve amber tus kapakli mekanik klavye. Sessiz switch, aluminym govde.',
    price: 1850,
    productType: 'simple',
    stock: 28,
    imageUrls: [IMG.klavye, IMG.lifestyle, IMG.kulaklik2],
  },
  {
    category: 'Elektronik',
    name: 'Tasinabilir Hoparlor',
    description:
      'Dokulu kumas kaplama, deri askili bluetooth hoparlor. IPX5 suya dayanikli.',
    price: 1200,
    productType: 'variant',
    imageUrls: [IMG.hoparlor, IMG.lifestyle, IMG.kulaklik1],
    variants: colorAxis([
      { label: 'Gri', colorHex: '#6B7280', stock: 20, sku: 'HOP-GRI' },
      { label: 'Siyah', colorHex: '#111111', stock: 14, sku: 'HOP-SIYAH' },
      { label: 'Kum', colorHex: '#D2B48C', stock: 9, sku: 'HOP-KUM' },
    ]),
  },
  {
    category: 'Giyim',
    name: 'Klasik Bej Trenckot',
    description:
      'Hafif bej trençkot. Mevsimlik, modern kesim. Gunluk ve is kombinlerine uyar.',
    price: 3490,
    productType: 'variant',
    imageUrls: [IMG.trenckot, IMG.lifestyle, IMG.gomlek],
    variants: sizeAxis('Beden', [
      { label: 'S', stock: 8, sku: 'TREN-S' },
      { label: 'M', stock: 14, sku: 'TREN-M' },
      { label: 'L', stock: 12, sku: 'TREN-L' },
      { label: 'XL', stock: 6, sku: 'TREN-XL' },
    ]),
  },
  {
    category: 'Giyim',
    name: 'Beyaz Deri Sneaker',
    description: 'Minimalist beyaz deri sneaker. Temiz siluet, rahat taban, gunluk kullanim.',
    price: 2190,
    productType: 'variant',
    imageUrls: [IMG.sneaker, IMG.lifestyle, IMG.trenckot],
    variants: sizeAxis('Beden', [
      { label: '40', stock: 7, sku: 'SNK-40' },
      { label: '41', stock: 10, sku: 'SNK-41' },
      { label: '42', stock: 12, sku: 'SNK-42' },
      { label: '43', stock: 9, sku: 'SNK-43' },
      { label: '44', stock: 5, sku: 'SNK-44' },
    ]),
  },
  {
    category: 'Giyim',
    name: 'Keten Karisimli Gomlek',
    description: 'Amber tonlu keten karisimli gomlek. Nefes alan kumas, rahat kesim.',
    price: 1290,
    productType: 'variant',
    imageUrls: [IMG.gomlek, IMG.trenckot, IMG.lifestyle],
    variants: sizeAxis('Beden', [
      { label: 'S', stock: 10, sku: 'GOM-S' },
      { label: 'M', stock: 16, sku: 'GOM-M' },
      { label: 'L', stock: 14, sku: 'GOM-L' },
      { label: 'XL', stock: 8, sku: 'GOM-XL' },
    ]),
  },
  {
    category: 'Aksesuar',
    name: 'Deri Capraz Canta',
    description: 'Espresso tonu deri capraz canta. Kompakt, gunluk kullanima uygun.',
    price: 1890,
    productType: 'variant',
    imageUrls: [IMG.canta, IMG.lifestyle, IMG.sneaker],
    variants: colorAxis([
      { label: 'Kahve', colorHex: '#4B2E1E', stock: 11, sku: 'CNT-KAHVE' },
      { label: 'Siyah', colorHex: '#111111', stock: 13, sku: 'CNT-SIYAH' },
    ]),
  },
  {
    category: 'Aksesuar',
    name: 'Ergonomik Ofis Koltugu',
    description: 'Koyu gri ergonomik ofis koltugu. Bel destegi, ayarlanabilir kollar.',
    price: 4850,
    productType: 'simple',
    stock: 12,
    imageUrls: [IMG.koltuk, IMG.lifestyle, IMG.klavye],
  },
];

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    const err = new Error(json.error || `HTTP ${response.status} ${path}`);
    err.status = response.status;
    err.details = json.details;
    throw err;
  }
  return json;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  const login = await api('/api/admin/login', {
    method: 'POST',
    body: { username: ADMIN_USER, password: ADMIN_PASSWORD },
  });
  const token = login.token;
  console.log('Admin girisi OK');

  const productsRes = await api('/api/products?limit=500', { token });
  const existing = productsRes.data || [];
  console.log(`Mevcut urun: ${existing.length}`);

  for (const product of existing) {
    try {
      await api(`/api/products/${product.id}`, { method: 'DELETE', token });
      console.log(`Silindi #${product.id} ${product.name}`);
    } catch (err) {
      console.warn(`Silinemedi #${product.id} ${product.name}: ${err.message}`);
      try {
        await api(`/api/products/${product.id}`, {
          method: 'PUT',
          token,
          body: {
            name: `Arsiv Urun ${product.id}`,
            description: 'Eski test urunu (siparis gecmisi nedeniyle silinemedi)',
            price: 1,
            stock: 0,
            imageUrl: null,
            imageUrls: [],
            categoryId: null,
            productType: 'simple',
            sortOrder: 900 + product.id,
          },
        });
        console.log(`Arsivlendi #${product.id}`);
      } catch (archiveErr) {
        console.warn(`Arsivlenemedi #${product.id}: ${archiveErr.message}`);
      }
    }
  }

  const catsRes = await api('/api/categories', { token });
  const existingCats = catsRes.data || [];
  const categoryIds = {};

  for (const name of CATEGORIES) {
    const found = existingCats.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      categoryIds[name] = found.id;
      continue;
    }
    const created = await api('/api/categories', {
      method: 'POST',
      token,
      body: { name, sortOrder: CATEGORIES.indexOf(name) + 1 },
    });
    categoryIds[name] = created.data.id;
    console.log(`Kategori: ${name} (#${created.data.id})`);
  }

  const createdIds = [];
  for (const [index, item] of PRODUCTS.entries()) {
    const payload = {
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.productType === 'variant' ? 0 : item.stock,
      imageUrl: item.imageUrls[0],
      imageUrls: item.imageUrls,
      categoryId: categoryIds[item.category],
      productType: item.productType,
      sortOrder: index + 1,
    };

    const created = await api('/api/products', { method: 'POST', token, body: payload });
    const product = created.data;
    createdIds.push(product.id);
    console.log(`Urun: ${product.name} (#${product.id})`);

    if (item.productType === 'variant' && item.variants) {
      await api(`/api/products/${product.id}/variants`, {
        method: 'PUT',
        token,
        body: item.variants,
      });
      console.log(`  Varyantlar kaydedildi (${item.variants.variants.length})`);
    }
  }

  await api('/api/products/reorder', {
    method: 'PUT',
    token,
    body: { productIds: createdIds },
  });

  const finalList = await api('/api/products?limit=50');
  console.log('\nCanli katalog:');
  for (const p of finalList.data || []) {
    console.log(
      `- #${p.id} ${p.name} | ${p.productType} | stok=${p.stock} | gorsel=${(p.imageUrls || []).length || (p.imageUrl ? 1 : 0)}`,
    );
  }
  console.log('\nBitti.');
}

main().catch((err) => {
  console.error('Seed basarisiz:', err.message, err.details || '');
  process.exit(1);
});
