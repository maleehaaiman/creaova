const { pool } = require('../db');

// Auto-create tables if they don't exist
async function ensureTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      brand_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image LONGTEXT,
      affiliate_link TEXT NOT NULL,
      commission_details TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS creator_affiliate_links (
      id INT PRIMARY KEY AUTO_INCREMENT,
      creator_id INT NOT NULL,
      affiliate_product_id INT NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_save (creator_id, affiliate_product_id)
    )
  `);
}

async function ensureProductColumns() {
  for (const definition of ['description TEXT NULL', 'category VARCHAR(120) NULL']) {
    try {
      await pool.execute(`ALTER TABLE affiliate_products ADD COLUMN ${definition}`);
    } catch (error) {
      if (!/duplicate column|already exists/i.test(error.message)) throw error;
    }
  }
}

ensureTables()
  .then(ensureProductColumns)
  .catch((err) => console.error('Affiliate tables init error:', err.message));

// POST /api/affiliates — Brand creates an affiliate product
async function createAffiliateProduct(req, res) {
  try {
    const userId = req.user.id;
    const { product_name, product_image, description, category, affiliate_link, commission_details } = req.body;

    if (!product_name || !affiliate_link) {
      return res.status(400).json({ error: 'Product name and affiliate link are required.' });
    }

    // Resolve brand_id from brand_profiles
    const [brandRows] = await pool.execute(
      'SELECT id FROM brand_profiles WHERE user_id = ?',
      [userId]
    );
    const brandId = brandRows.length > 0 ? brandRows[0].id : userId;

    const [result] = await pool.execute(
      `INSERT INTO affiliate_products (brand_id, product_name, product_image, description, category, affiliate_link, commission_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [brandId, product_name, product_image || null, description || null, category || null, affiliate_link, commission_details || null]
    );

    const [newProduct] = await pool.execute(
      'SELECT * FROM affiliate_products WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ message: 'Affiliate product created.', product: newProduct[0] });
  } catch (error) {
    console.error('createAffiliateProduct error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/affiliates/my-products — Brand sees their own products
async function getBrandAffiliateProducts(req, res) {
  try {
    const userId = req.user.id;

    const [brandRows] = await pool.execute(
      'SELECT id FROM brand_profiles WHERE user_id = ?',
      [userId]
    );
    const brandId = brandRows.length > 0 ? brandRows[0].id : userId;

    const [rows] = await pool.execute(
      `SELECT ap.*,
              COUNT(cal.id) AS saves_count
       FROM affiliate_products ap
       LEFT JOIN creator_affiliate_links cal ON cal.affiliate_product_id = ap.id
       WHERE ap.brand_id = ?
       GROUP BY ap.id
       ORDER BY ap.created_at DESC`,
      [brandId]
    );

    return res.json({ products: rows });
  } catch (error) {
    console.error('getBrandAffiliateProducts error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/affiliates/:id - Brand edits its own affiliate product
async function updateAffiliateProduct(req, res) {
  try {
    const productId = Number.parseInt(req.params.id, 10);
    const { product_name, product_image, description, category, affiliate_link, commission_details } = req.body;
    const [brandRows] = await pool.execute('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
    const brandId = brandRows.length > 0 ? brandRows[0].id : req.user.id;
    const [result] = await pool.execute(
      `UPDATE affiliate_products
       SET product_name = COALESCE(?, product_name), product_image = COALESCE(?, product_image),
           description = COALESCE(?, description), category = COALESCE(?, category),
           affiliate_link = COALESCE(?, affiliate_link), commission_details = COALESCE(?, commission_details)
       WHERE id = ? AND brand_id = ?`,
      [product_name || null, product_image || null, description || null, category || null, affiliate_link || null, commission_details || null, productId, brandId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Affiliate product not found.' });
    const [rows] = await pool.execute('SELECT * FROM affiliate_products WHERE id = ?', [productId]);
    return res.json({ product: rows[0] });
  } catch (error) {
    console.error('updateAffiliateProduct error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/affiliates — All active products for creators to discover
async function getAllAffiliateProducts(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT ap.*,
              bp.company_name, bp.logo,
              COUNT(cal.id) AS saves_count
       FROM affiliate_products ap
       LEFT JOIN brand_profiles bp ON ap.brand_id = bp.id
       LEFT JOIN creator_affiliate_links cal ON cal.affiliate_product_id = ap.id
       WHERE ap.is_active = 1
       GROUP BY ap.id
       ORDER BY ap.created_at DESC`
    );

    return res.json({ products: rows });
  } catch (error) {
    console.error('getAllAffiliateProducts error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/affiliates/:id/save — Creator saves a product link
async function saveAffiliateLink(req, res) {
  try {
    const creatorId = req.user.id;
    const productId = parseInt(req.params.id, 10);

    // Check product exists
    const [productRows] = await pool.execute(
      'SELECT id FROM affiliate_products WHERE id = ? AND is_active = 1',
      [productId]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Affiliate product not found.' });
    }

    await pool.execute(
      `INSERT IGNORE INTO creator_affiliate_links (creator_id, affiliate_product_id) VALUES (?, ?)`,
      [creatorId, productId]
    );

    return res.json({ message: 'Link saved successfully.' });
  } catch (error) {
    console.error('saveAffiliateLink error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// DELETE /api/affiliates/:id/save — Creator removes a saved link
async function unsaveAffiliateLink(req, res) {
  try {
    const creatorId = req.user.id;
    const productId = parseInt(req.params.id, 10);

    await pool.execute(
      'DELETE FROM creator_affiliate_links WHERE creator_id = ? AND affiliate_product_id = ?',
      [creatorId, productId]
    );

    return res.json({ message: 'Link removed.' });
  } catch (error) {
    console.error('unsaveAffiliateLink error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/affiliates/my-links — Creator gets their saved links
async function getMyAffiliateLinks(req, res) {
  try {
    const creatorId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT ap.*, bp.company_name, bp.logo, cal.saved_at
       FROM creator_affiliate_links cal
       JOIN affiliate_products ap ON cal.affiliate_product_id = ap.id
       LEFT JOIN brand_profiles bp ON ap.brand_id = bp.id
       WHERE cal.creator_id = ?
       ORDER BY cal.saved_at DESC`,
      [creatorId]
    );

    return res.json({ links: rows });
  } catch (error) {
    console.error('getMyAffiliateLinks error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/affiliates/creators/:id — Public links currently used by a creator
async function getCreatorPublicAffiliateLinks(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT ap.id, ap.product_name, ap.product_image, ap.affiliate_link,
              ap.description, ap.category, ap.commission_details, bp.company_name, bp.logo
       FROM creator_affiliate_links cal
       JOIN affiliate_products ap ON cal.affiliate_product_id = ap.id
       LEFT JOIN brand_profiles bp ON ap.brand_id = bp.id
       JOIN creator_profiles cp ON cal.creator_id = cp.user_id OR cal.creator_id = cp.id
       WHERE cp.user_id = ? AND ap.is_active = 1
       ORDER BY cal.saved_at DESC`,
      [req.params.id]
    );

    return res.json({ links: rows });
  } catch (error) {
    console.error('getCreatorPublicAffiliateLinks error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/affiliates/brands/:id — Public products offered by a brand
async function getBrandPublicAffiliateProducts(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT ap.id, ap.product_name, ap.product_image, ap.affiliate_link,
              ap.description, ap.category, ap.commission_details, bp.company_name, bp.logo
       FROM affiliate_products ap
       JOIN brand_profiles bp ON ap.brand_id = bp.id OR ap.brand_id = bp.user_id
       WHERE bp.user_id = ? AND ap.is_active = 1
       ORDER BY ap.created_at DESC`,
      [req.params.id]
    );

    return res.json({ products: rows });
  } catch (error) {
    console.error('getBrandPublicAffiliateProducts error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// DELETE /api/affiliates/:id — Brand deletes one of their products
async function deleteAffiliateProduct(req, res) {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id, 10);

    const [brandRows] = await pool.execute(
      'SELECT id FROM brand_profiles WHERE user_id = ?',
      [userId]
    );
    const brandId = brandRows.length > 0 ? brandRows[0].id : userId;

    await pool.execute(
      'DELETE FROM affiliate_products WHERE id = ? AND brand_id = ?',
      [productId, brandId]
    );

    return res.json({ message: 'Product deleted.' });
  } catch (error) {
    console.error('deleteAffiliateProduct error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  createAffiliateProduct,
  updateAffiliateProduct,
  getBrandAffiliateProducts,
  getAllAffiliateProducts,
  saveAffiliateLink,
  unsaveAffiliateLink,
  getMyAffiliateLinks,
  getCreatorPublicAffiliateLinks,
  getBrandPublicAffiliateProducts,
  deleteAffiliateProduct
};
