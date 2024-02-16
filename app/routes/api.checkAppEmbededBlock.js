import { authenticate } from "../shopify.server.js";
import dotenv from "dotenv";

dotenv.config();

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const regExp = new RegExp(
      process.env.SHOPIFY_AUTOMATIC_BXGY_DISCOUNT_EXTENSION_ID
    );
    // console.log("regExp ====", regExp);

    const data = await admin.rest.resources.Shop.all({ session });
    // console.log("data =======", data);
    const allThemes = await admin.rest.resources.Theme.all({
      session: session,
    });
    // console.log("allThemes =======", allThemes);

    const activeThemes = allThemes.data.filter((item) => {
      return item.role === "main";
    });
    // console.log("activeThemes =====", activeThemes);

    const activeThemeId = activeThemes[0].id;

    const asset = await admin.rest.resources.Asset.all({
      session: session,
      theme_id: activeThemeId,
      asset: { key: "config/settings_data.json" },
    });
    // console.log("assetttt ===", asset);

    const assetValue = asset.data[0]?.value;
    const parsedAssetValue = JSON.parse(assetValue);
    // console.log("parsedAssetValue ====", parsedAssetValue);

    let appEmbededBlockDisabled = true;
 

    if (parsedAssetValue.current?.blocks) {
      console.log("inside blocksssss ");
      const objectArray = Object.entries(parsedAssetValue.current.blocks);
      // console.log("objectArray ===", objectArray);

      const filteredObjectArray = objectArray.filter((item) => {
        return regExp.test(item[1].type);
      });
      // console.log("filteredObjectArray ==", filteredObjectArray);

      if (filteredObjectArray.length) {
        appEmbededBlockDisabled = filteredObjectArray[0][1].disabled;
        // console.log("appEmbededBlockDisabled =====", appEmbededBlockDisabled);
      }
    }
    console.log("appEmbededBlockDisabled ===", appEmbededBlockDisabled);
    // console.log("shopppp ====", data.data[0]);

    return {
      appEmbededBlockDisabled,
      shopData: data.data[0],
    };
  } catch (error) {
    console.log("Error in embed route", error);
    throw error;
  }
};
