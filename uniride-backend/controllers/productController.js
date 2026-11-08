import Product from '../models/Product.js';

/**
 * GET /api/products
 * Query Params:
 *   - ?storeId=store-pizzahut
 *   - ?category=grocery (or ?templateKey=pizza)
 *   - ?tag=Cheese Kottu
 *   - ?search=wing (case-insensitive search by product NAME, tag, or description)
 *   - ?sort=highest | lowest | popular
 */
export const getAllProducts = async (req, res) => {
  try {
    const { storeId, category, templateKey, tag, search, sort } = req.query;

    // 1. Build dynamic Mongoose `filter` object (empty `{}` when no query parameters are passed)
    const filter = {};

    if (storeId) {
      filter.storeId = storeId;
    }

    if (category) {
      filter.category = category;
    }

    if (templateKey) {
      filter.templateKey = templateKey;
    }

    if (tag && tag !== 'Featured items' && tag !== 'Picked for you') {
      filter.tag = tag;
    }

    // Search by product NAME (and tag/desc) case-insensitively — NOT by ID
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { tag: searchRegex },
        { desc: searchRegex },
      ];
    }

    // 2. Build dynamic Mongoose `sortOption` object
    let sortOption = {};
    if (sort === 'highest') {
      sortOption = { price: -1 }; // Price: Highest to Lowest
    } else if (sort === 'lowest') {
      sortOption = { price: 1 }; // Price: Lowest to Highest
    } else if (sort === 'popular') {
      sortOption = { likesPct: -1, likesCount: -1 }; // Most liked / popular first
    } else if (sort === 'top-budget') {
      filter.price = { $lte: 1200 }; // Top Budget items
      sortOption = { price: 1 };
    }

    // 3. Execute standard Mongoose query
    const products = await Product.find(filter).sort(sortOption).lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      sort: sort || 'default',
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

/**
 * GET /api/products/:id
 * Executes `await Product.findById(req.params.id)` when a user clicks a product card
 * to open the Product Quick-View / Add-to-Order Modal.
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product =
      (await Product.findById(id).lean()) || (await Product.findOne({ id }).lean());

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product by ID',
      error: error.message,
    });
  }
};
