import productDetails from "../Database/productDetails";

export const action = async ({ request }) => {
  try {
    const result = await request.json();
    // console.log("editapi =======", result);

    const findOffer = await productDetails.findOne({ OfferId: result });
    // console.log("findOrder ======", findOffer);
    if (findOffer) {
      return {
        data: findOffer,
      };
    }
  } catch (error) {
    console.log("error ======", error);
    return error;
  }
};
