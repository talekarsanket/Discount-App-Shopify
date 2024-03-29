import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  storeURL: String,
  buyProduct: {
    productID: String,
    productTitle: String,
    productVarientId: String,
    productPrice: String,
  },
  getProduct: {
    productId: String,
    productTitle: String,
    productVarientId: String,
    productPrice: String,
  },
  DiscountInPercent: Number,
  OfferTitle: String,
  OfferId: String,
  offerType: String,
  OfferStartDate: String,
  OfferEndDate: String,
  isActive: String,
});

const ProductModel = mongoose.models.productDetails || mongoose.model("productDetails", productSchema);
export default ProductModel;

// export default mongoose.model("productDetails", productSchema);
