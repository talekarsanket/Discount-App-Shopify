import productDetails from "../Database/productDetails";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    const offerId = await request.json();
    // console.log("offerId =====", offerId);

    const response = await admin.graphql(
      `#graphql
            mutation discountAutomaticActivate($id: ID!) {
              discountAutomaticActivate(id: $id) {
                automaticDiscountNode {
                  automaticDiscount {
                    ... on DiscountAutomaticBxgy {
                      status
                      startsAt
                      endsAt
                    }
                  }
                }
                userErrors {
                  field
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

    const data = await response.json();
    console.log("dataaaa ==============", data);

    const discountActive = data.data.discountAutomaticActivate.automaticDiscountNode;
    console.log("discountActive ====", discountActive);

    const userError = data.data.discountAutomaticActivate.userErrors[0];
    console.log("userError ====", userError);

    if (discountActive) {
      let activateDsicountInDB = await productDetails.findOneAndUpdate(
        { OfferId: offerId },
        {
          OfferEndDate: null,
          isActive: "Active",
        }
      );
      // console.log("activateDsicountInDB ====", activateDsicountInDB);
      return {
        message: "Offer Activated",
        status: 200,
      };
    } else if (userError) {
      return {
        message: userError.message,
        status: 201,
      };
    }
  } catch (error) {
    console.log("error in activate route =====", error);
    return error;
  }
};
