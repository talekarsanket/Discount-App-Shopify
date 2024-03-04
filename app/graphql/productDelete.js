import productDetails from "../Database/productDetails";

export const productDeleteCheck = async (id, admin, session) => {
  console.log("idddd========", id);

  try {
    let findProduct = await productDetails.findOne({
      $or: [{ "buyProduct.productID": id }, { "getProduct.productId": id }],
    });
    // console.log("findProduct ===", findProduct);

    if (findProduct) {
      console.log("findProduct ====", findProduct);
      const response = await admin.graphql(
        `mutation discountAutomaticDelete($id: ID!) {
            discountAutomaticDelete(id: $id) {
              deletedAutomaticDiscountId
              userErrors {
                field
                code
                message
              }
            }
          }`,
        {
          variables: {
            id: `gid://shopify/DiscountAutomaticNode/${findProduct.OfferId}`,
          },
        }
      );

      const jsonResponse = await response.json();
      console.log("json responseee =====", jsonResponse);

      if (jsonResponse.data && jsonResponse.data.discountAutomaticDelete) {
        const deletedAutomaticDiscountId =
          jsonResponse.data.discountAutomaticDelete.deletedAutomaticDiscountId;

        if (jsonResponse) {
          let splitId = deletedAutomaticDiscountId.split("/")[4];
          await productDetails.findOneAndDelete({ OfferId: splitId });
        }

        const userErrors = jsonResponse.data.discountAutomaticDelete.userErrors;
        if (userErrors && userErrors.length > 0) {
          console.log("GraphQL mutation user errors ====", userErrors);
        }
      } else {
        console.error("Invalid or missing data in GraphQL mutation response.");
      }
    }
  } catch (error) {
    console.error("Error in productDeleteCheck:", error);
    throw error;
  }
};
