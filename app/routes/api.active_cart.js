import productDetails from "../Database/productDetails";

export const loader = async () => {
  try {
    // console.log("==========active cart api call===========");
    const checkOffers = await productDetails.find();
    // console.log("checkOffers ===", checkOffers);
    return checkOffers;
  } catch (error) {
    console.log(" error =======", error);
    return error;
  }
};
