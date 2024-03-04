import { authenticate } from "../shopify.server";
import productDetails from "../Database/productDetails";

export const action = async ({ request }) => {
  const offerId = await request.json();

  try {
    const { admin } = await authenticate.admin(request);

    const deleteAPi = await admin.graphql(
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
          id: `gid://shopify/DiscountAutomaticNode/${offerId}`,
        },
      }
    );

    const deleteApiResponse = await deleteAPi.json();
    // console.log("deleteAPI ============", deleteApiResponse);

    const getResponseOfferId =
      deleteApiResponse.data.discountAutomaticDelete.deletedAutomaticDiscountId;
    // console.log("getResponseOfferId =========", getResponseOfferId);

    const userErrors =
      deleteApiResponse.data.discountAutomaticDelete.userErrors[0];
    console.log("error ===", userErrors);

    if (getResponseOfferId) {
      let splitId = getResponseOfferId.split("/")[4];
      
      const deleteOfferDatabase = await productDetails.findOneAndDelete({
        OfferId: splitId,
      }); 
      // console.log("deleteOfferDatabase ====", deleteOfferDatabase);

      return {
        message: "Offer successfully delete",
        status: 201,
      };
    } else if (userErrors) {
      return {
        status: 205,
        message: userErrors.message,
      };
    }
  } catch (error) {
    console.log("error in delete API", error);
    return {
      status: 404,
      message: error.message,
    };
  }
};
