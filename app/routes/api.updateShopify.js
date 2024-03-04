import { authenticate } from "../shopify.server";
import { updateDiscount as graphqlUpdateDiscount } from "../graphql/updateDiscountAPI";

export const action = async ({ request }) => {
  const data = await request.json();
  // console.log("request=====", data);

  try {
    const { admin, session } = await authenticate.admin(request);

    const response = await graphqlUpdateDiscount(
      admin.graphql,
      data,
      session.shop
    );
    // console.log("responseee===============", response);
    return response;
    
  } catch (error) {
    console.log("errorrrr===", error);
  }
};
